const { SlashCommandBuilder, MessageFlags, ButtonStyle, ButtonBuilder, ActionRowBuilder, EmbedBuilder, Colors} = require("discord.js");
const { RegExpMatcher, englishDataset, englishRecommendedTransformers } = require('obscenity');
const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
});
const {colorTest} = require("j27-lib");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("team")
        .setDescription("Team commands")
        .addSubcommand(subcommand => {
            subcommand
                .setName("create")
                .setDescription('Create a new team')
                .addStringOption((option) => {
                    option
                        .setName("name")
                        .setDescription("The name for your team")
                        .setRequired(true)
                    return option;
                })
            return subcommand;
        })
        .addSubcommand(subcommand => {
            subcommand
                .setName("manage")
                .setDescription('Manage a team')
                .addStringOption((option) => {
                    option
                        .setName("name")
                        .setDescription("Your new team name")
                    return option;
                })
                .addStringOption((option) => {
                    option
                        .setName("invite")
                        .setDescription("The invite link to your team's server, if applicable")
                    return option;
                })
                .addStringOption((option) => {
                    option
                        .setName("color")
                        .setDescription("Edit your team's color. Must be a hex code")
                    return option;
                })
            return subcommand;
        })
        .addSubcommand(subcommand => {
            subcommand
                .setName("invite")
                .setDescription('Invite a member to join your team')
                .addUserOption((option) => {
                    option
                        .setName("user")
                        .setDescription("The user to invite")
                        .setRequired(true)
                    return option;
                })
            return subcommand;
        }).addSubcommand(subcommand => {
            subcommand
                .setName("transfer")
                .setDescription('Transfer ownership of your team')
                .addUserOption((option) => {
                    option
                        .setName("user")
                        .setDescription("The user to transfer ownership to")
                        .setRequired(true)
                    return option;
                })
            return subcommand;
        })
        .addSubcommand(subcommand => {
            subcommand
                .setName("list")
                .setDescription('List all teams')
                return subcommand;
        }),

    async execute(interaction) {
        await interaction.deferReply( { flags: MessageFlags.Ephemeral } );
        const database = interaction.client.mongo.db("avalon");
        const coll = database.collection("teams");
        const invites = database.collection("invites");
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.user;
        const doc = await coll.findOne({ owner: user.id } );
        const adminChannel = await interaction.guild.channels.fetch('1549162267470463046');
        switch (subcommand) {
            case "create":
                if (await coll.findOne({owner: user.id})) {
                    return await interaction.editReply('You can only own one team');
                }
                const name = await interaction.options.getString('name');
                if (matcher.hasMatch(name)) {
                    console.log('The input text contains profanities');
                    return await interaction.editReply('Your team name must be appropriate');
                }
                if (await coll.findOne({name: name.toLowerCase()}) !== null) {
                    return await interaction.editReply('Name already in use');
                }
                const members = [];
                members.push(user.id);
                await coll.insertOne({
                    name: name.toLowerCase(),
                    nameProper: name,
                    owner: user.id,
                    members: members,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
                await interaction.guild.roles.create({
                    name: name,
                })
                    .then(console.log)
                    .catch(console.error);
                let add = interaction.guild.roles.cache.find(r => r.name === name);
                await interaction.member.roles.add(add);
                await adminChannel.send(`${interaction.member.displayName} has created ${name}`);
                return await interaction.editReply({content: `Successfully created ${name}`});
            case "manage":
                if (doc === null) {
                    return await interaction.editReply('You do not own a team yet');
                }
                const role = await interaction.guild.roles.cache.find(r => r.name === doc.nameProper);
                const newName = await interaction.options.getString('name');
                if (newName !== null) {
                    if (matcher.hasMatch(newName)) {
                        console.log('The input text contains profanities');
                        return await interaction.followUp('Your team name must be appropriate');
                    }
                    if (await coll.findOne({name: newName.toLowerCase()}) !== null) {
                        return await interaction.followUp('Name already in use');
                    }
                    await coll.updateOne({owner: user.id}, {
                        $set: {
                            name: newName.toLowerCase(),
                            nameProper: newName,
                            updatedAt: new Date(),
                        }
                    });
                    await interaction.guild.roles.edit(role, {name: newName})
                        .then(updated => console.log(`Edited role name to ${updated.newName}`))
                        .catch(console.error);
                    await adminChannel.send(`${interaction.member.displayName} has changed their team name to ${newName}`);
                }
                const color = interaction.options.getString("color");
                if (color !== null) {
                    let check = colorTest(color);
                    if (!check) {
                        await interaction.channel.followUp({content: `${color} is not a valid hex code`, flags: MessageFlags.Ephemeral});
                    } else {
                        await coll.updateOne({owner: user.id}, {
                            $set: {
                                color: color,
                                updatedAt: new Date(),
                            }
                        });
                        await role.setColors({primaryColor: color});
                        await adminChannel.send(`${interaction.member.displayName} has changed their team color to ${color}`);
                    }
                }
                const invite = await interaction.options.getString("invite");
                if (invite !== null) {
                    const inviteRegex = /^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9-]+)$/;
                    const inviteTest = inviteRegex.test(invite.trim());
                    if (inviteTest) {
                        await coll.updateOne({owner: user.id}, {
                            $set: {
                                invite: invite,
                                updatedAt: new Date(),
                            }
                        });
                        await adminChannel.send(`${interaction.member.displayName} has set their team server invite to ${invite}`);
                    } else {
                        await interaction.followUp({content: `\`${invite}\` is not a valid server invite`, flags: MessageFlags.Ephemeral})
                    }
                }
                return await interaction.editReply({content: `Set team name to ${newName ?? doc.nameProper}. Set team color to ${color ?? 'default'}. Set team server invite to ${invite ?? 'none'}.`});
            case "invite":
                if (doc === null) {
                    return await interaction.editReply('You do not own a team yet');
                }
                const addRole = await interaction.guild.roles.cache.find(r => r.name === doc.nameProper);
                const newMember =  await interaction.options.getMember('user');
                if (doc.members.includes(newMember.id)) return await interaction.editReply(`${newMember.displayName} is already in ${doc.nameProper}`);
                await invites.insertOne({
                    teamId: doc._id,
                    newMember: newMember.id,
                    owner: doc.owner,
                    status: "Pending",
                    role: addRole.id,
                });
                const accept = new ButtonBuilder().setCustomId(`team-invite-${doc.owner}-${newMember.id}-accept`).setLabel('Accept Invitation').setStyle(ButtonStyle.Success);
                const deny = new ButtonBuilder().setCustomId(`team-invite-${doc.owner}-${newMember.id}-deny`).setLabel('Deny Invitation').setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder().addComponents(accept, deny);
                try {
                    const invitedUser = await interaction.client.users.fetch(newMember.id);
                    await invitedUser.send({content: `${interaction.user.username} has invited you to join ${doc.nameProper}.`, components: [row]});
                } catch (error) {
                    console.error('Could not send DM:', error);
                }
                return await interaction.editReply(`Sent join request to ${newMember.displayName}`);
            case "list":
                const docs = await coll.find();
                let embeds = []
                for await (const doc of docs) {
                    console.log(doc);
                    let memberList = '';
                    for (let i = 0; i < doc.members.length; i++) {
                        memberList += '- ';
                        let userId = doc.members[i];
                        let user = await interaction.client.users.fetch(userId);
                        memberList += user.username;
                        if (userId === doc.owner) {
                            memberList += ' (Owner)';
                        }
                        memberList += '\n';
                    }
                    let color = Colors.Default;
                    if (doc.color !== undefined && doc.color !== null) {
                        color = '#' + doc.color.replace('#', '').toLowerCase();
                    }
                    let invite = 'No server invite provided'
                    if (doc.invite !== undefined && doc.invite !== null) {
                        invite = doc.invite;
                    }
                    const embed = new EmbedBuilder()
                        .setTitle(doc.nameProper)
                        .addFields({name: 'Members:', value: memberList})
                        .addFields({name: '\u2000', value: `Server Invite - ${invite}`})
                        .setColor(color);
                    embeds.push(embed);
                }
            await interaction.channel.send({content: `-# List queried by <@${interaction.user.id}>`, embeds: embeds});
            return await interaction.editReply('List sent');
            case "transfer":
                if (doc === null) {
                    return await interaction.editReply('You do not own a team yet');
                }
                const newOwner = await interaction.options.getUser('user');
                const confirmButton = new ButtonBuilder()
                    .setCustomId(`confirm-transfer-${newOwner.id}-${doc.owner}`)
                    .setLabel('Transfer Ownership')
                    .setStyle(ButtonStyle.Danger);
                const cancelButton = new ButtonBuilder()
                    .setCustomId(`cancel-transfer-${newOwner.id}-${doc.owner}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary);
                const confirmRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
                return await interaction.editReply({content: `Confirm you wish to transfer ownership of ${doc.nameProper} to ${newOwner}`, components: [confirmRow]});
        }
    }
}