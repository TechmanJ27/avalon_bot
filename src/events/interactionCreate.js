const { Events, MessageFlags, Collection } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }


            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1_000);
                    return interaction.reply({
                        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: 'There was an error while executing this command!',
                        flags: MessageFlags.Ephemeral,
                    }).catch(() => {});
                } else {
                    await interaction.reply({
                        content: 'There was an error while executing this command!',
                        flags: MessageFlags.Ephemeral,
                    }).catch(() => {});
                }
            }
        }

        if (interaction.isButton()) {
            const button = interaction.customId;
            const buttonArray = button.split('-');
            const database = interaction.client.mongo.db("avalon");
            const teams = database.collection("teams");
            const invites = database.collection("invites");
            const guild = await interaction.client.guilds.fetch('1528908151041167500');
            const adminChannelSMP = await guild.channels.fetch('1549162267470463046');

            if (buttonArray[4] === 'accept' || buttonArray[4] === 'deny') {
                await interaction.deferUpdate();

                const newMemberId = buttonArray[3];

                const inviteDoc = await invites.findOne({ owner: buttonArray[2], newMember: newMemberId, status: "Pending" });
                if (!inviteDoc) {
                    return interaction.followUp({ content: 'This invite is invalid or has already been processed.', flags: MessageFlags.Ephemeral });
                }
                const teamDoc = await teams.findOne({owner: buttonArray[2], _id: inviteDoc.teamId });

                const guildMember = await guild.members.fetch(newMemberId);
                const addRole = await guild.roles.fetch(inviteDoc.role);

                await interaction.message.edit({ components: [] });

                const ownerUser = await interaction.client.users.fetch(teamDoc.owner);

                if (buttonArray[4] === 'accept') {
                    await guildMember.roles.add(addRole);

                    await teams.updateOne({owner: teamDoc.owner}, {$push: {members: newMemberId}});
                    await invites.deleteOne(inviteDoc);

                    await adminChannelSMP.send(`${guildMember.displayName} has joined ${teamDoc.nameProper}`);
                    await interaction.followUp('Invitation Accepted')
                    return await ownerUser.send(`${guildMember.displayName} has accepted your invite to ${teamDoc.nameProper}`);

                } else if (buttonArray[4] === 'deny') {
                    await invites.deleteOne(inviteDoc);

                    await adminChannelSMP.send(`${interaction.user.username} has rejected an invite to join ${teamDoc.nameProper}`);
                    await interaction.followUp('Invitation Denied')
                    return await ownerUser.send(`${interaction.user.username} has rejected an invite to join ${teamDoc.nameProper}`);
                }
            }
            if (buttonArray[0] === 'confirm' && buttonArray[1] === 'transfer') {
                const newOwner = buttonArray[2];
                const newOwnerMember = await guild.members.fetch(newOwner);
                const teamDoc = await teams.findOne({owner: interaction.user.id});
                await adminChannelSMP.send(`Ownership of ${teamDoc.nameProper} transferred to ${newOwner}`);
                await newOwnerMember.user.send(`You have been transferred ownership of ${teamDoc.nameProper}`);
                await teams.updateOne({owner: interaction.user.id}, {$set: {owner: newOwner}});
                return await interaction.update({content: `Ownership transferred to ${newOwner}`, components: []});
            } else if (buttonArray[0] === 'cancel' && buttonArray[1] === 'transfer') {
                return await interaction.update(`Ownership transfer cancelled`);
            }
        }
    },
};
