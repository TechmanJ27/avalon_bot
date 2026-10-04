import {
    Events,
    MessageFlags,
    Collection,
    Interaction,
    TextChannel
} from 'discord.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {

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
            const timestamps = cooldowns.get(command.data.name)!;
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

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
                const errorPayload = {
                    content: 'There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral,
                };

                if (interaction.replied || interaction.deferred) {
                    // @ts-ignore
                    await interaction.followUp(errorPayload).catch(() => {});
                } else {
                    // @ts-ignore
                    await interaction.reply(errorPayload).catch(() => {});
                }
            }
            return;
        }

        if (interaction.isButton()) {
            const buttonArray = interaction.customId.split('-');
            const database = interaction.client.mongo.db('avalon');
            const teams = database.collection('teams');
            const invites = database.collection('invites');

            const guild = await interaction.client.guilds.fetch('1528908151041167500');
            const adminChannelSMP = await guild.channels.fetch('1549162267470463046') as TextChannel | null;

            if (buttonArray[4] === 'accept' || buttonArray[4] === 'deny') {
                await interaction.deferUpdate();

                const ownerId = buttonArray[2];
                const newMemberId = buttonArray[3];
                const action = buttonArray[4];

                const inviteDoc = await invites.findOne({ owner: ownerId, newMember: newMemberId, status: 'Pending' });
                if (!inviteDoc) {
                    return interaction.followUp({
                        content: 'This invite is invalid or has already been processed.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const teamDoc = await teams.findOne({ owner: ownerId, _id: inviteDoc.teamId });
                if (!teamDoc) {
                    return interaction.followUp({
                        content: 'Associated team could not be found.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const guildMember = await guild.members.fetch(newMemberId);
                const addRole = inviteDoc.role ? await guild.roles.fetch(inviteDoc.role) : null;

                await interaction.message.edit({ components: [] });

                const ownerUser = await interaction.client.users.fetch(teamDoc.owner);

                if (action === 'accept') {
                    if (addRole) await guildMember.roles.add(addRole);

                    await teams.updateOne({ owner: teamDoc.owner }, { $push: { members: newMemberId as any } });
                    await invites.deleteOne({ _id: inviteDoc._id });

                    if (adminChannelSMP) {
                        await adminChannelSMP.send(`${guildMember.displayName} has joined ${teamDoc.nameProper}`);
                    }

                    await interaction.followUp({ content: 'Invitation Accepted', flags: MessageFlags.Ephemeral });
                    return await ownerUser.send(`${guildMember.displayName} has accepted your invite to ${teamDoc.nameProper}`);

                } else if (action === 'deny') {
                    await invites.deleteOne({ _id: inviteDoc._id });

                    if (adminChannelSMP) {
                        await adminChannelSMP.send(`${interaction.user.username} has rejected an invite to join ${teamDoc.nameProper}`);
                    }

                    await interaction.followUp({ content: 'Invitation Denied', flags: MessageFlags.Ephemeral });
                    return await ownerUser.send(`${interaction.user.username} has rejected an invite to join ${teamDoc.nameProper}`);
                }
            }

            if (buttonArray[0] === 'confirm' && buttonArray[1] === 'transfer') {
                const newOwnerId = buttonArray[2];
                const newOwnerMember = await guild.members.fetch(newOwnerId);
                const teamDoc = await teams.findOne({ owner: interaction.user.id });

                if (!teamDoc) {
                    return interaction.reply({ content: 'You do not currently own a team.', flags: MessageFlags.Ephemeral });
                }

                if (adminChannelSMP) {
                    await adminChannelSMP.send(`Ownership of ${teamDoc.nameProper} transferred to <@${newOwnerId}>`);
                }

                await newOwnerMember.user.send(`You have been transferred ownership of ${teamDoc.nameProper}`);
                await teams.updateOne({ owner: interaction.user.id }, { $set: { owner: newOwnerId } });

                return await interaction.update({
                    content: `Ownership transferred to <@${newOwnerId}>`,
                    components: []
                });

            } else if (buttonArray[0] === 'cancel' && buttonArray[1] === 'transfer') {
                return await interaction.update({
                    content: 'Ownership transfer cancelled.',
                    components: []
                });
            }
        }
    },
};