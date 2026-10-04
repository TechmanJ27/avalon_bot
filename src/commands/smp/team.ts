import {
    SlashCommandBuilder,
    MessageFlags,
    ButtonStyle,
    ButtonBuilder,
    ActionRowBuilder,
    EmbedBuilder,
    Colors,
    ChatInputCommandInteraction,
    ColorResolvable
} from "discord.js";
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';

const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
});

export default {
    data: new SlashCommandBuilder()
        .setName("team")
        .setDescription("Team commands")
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription('Create a new team')
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("The name for your team")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("manage")
                .setDescription('Manage a team')
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("Your new team name")
                )
                .addStringOption(option =>
                    option
                        .setName("invite")
                        .setDescription("The invite link to your team's server, if applicable")
                )
                .addStringOption(option =>
                    option
                        .setName("color")
                        .setDescription("Edit your team's color. Must be a hex code")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("invite")
                .setDescription('Invite a member to join your team')
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("The user to invite")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("transfer")
                .setDescription('Transfer ownership of your team')
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("The user to transfer ownership to")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription('List all teams')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!interaction.inCachedGuild()) {
            await interaction.editReply({ content: 'This command can only be used in a server.' });
            return;
        }

        const database = interaction.client.mongo.db("avalon");
        const coll = database.collection("teams");
        const invites = database.collection("invites");
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.user;
        const doc = await coll.findOne({ owner: user.id });

        const adminChannel = await interaction.guild.channels.fetch('1549162267470463046');
        if (!adminChannel || !adminChannel.isTextBased()) return;

        switch (subcommand) {
            case "create": {
                if (await coll.findOne({ owner: user.id })) {
                    return await interaction.editReply('You can only own one team');
                }
                const name = interaction.options.getString('name');
                if (!name) return await interaction.editReply('Please enter a name');

                if (matcher.hasMatch(name)) {
                    console.log('The input text contains profanities');
                    return await interaction.editReply('Your team name must be appropriate');
                }
                if (await coll.findOne({ name: name.toLowerCase() }) !== null) {
                    return await interaction.editReply('Name already in use');
                }

                await coll.insertOne({
                    name: name.toLowerCase(),
                    nameProper: name,
                    owner: user.id,
                    members: [user.id],
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                const createdRole = await interaction.guild.roles.create({ name }).catch(console.error);
                if (createdRole) {
                    await interaction.member.roles.add(createdRole);
                }

                await adminChannel.send(`${interaction.member.displayName} has created ${name}`);
                return await interaction.editReply({ content: `Successfully created ${name}` });
            }

            case "manage": {
                if (doc === null) {
                    return await interaction.editReply('You do not own a team yet');
                }

                const role = interaction.guild.roles.cache.find(r => r.name === doc.nameProper);
                if (!role) return await interaction.editReply('Team role does not exist');

                const newName = interaction.options.getString('name');
                if (newName !== null) {
                    if (matcher.hasMatch(newName)) {
                        return await interaction.followUp('Your team name must be appropriate');
                    }
                    if (await coll.findOne({ name: newName.toLowerCase() }) !== null) {
                        return await interaction.followUp('Name already in use');
                    }
                    await coll.updateOne({ owner: user.id }, {
                        $set: {
                            name: newName.toLowerCase(),
                            nameProper: newName,
                            updatedAt: new Date(),
                        }
                    });
                    await interaction.guild.roles.edit(role, { name: newName }).catch(console.error);
                    await adminChannel.send(`${interaction.member.displayName} has changed their team name to ${newName}`);
                }

                const color = interaction.options.getString("color");
                if (color !== null) {
                    const hexRegex = /^#?([0-9A-F]{3}){1,2}$/i;
                    if (!hexRegex.test(color)) {
                        if (interaction.channel && interaction.channel.isTextBased()) {
                            await interaction.channel.send({ content: `${color} is not a valid hex code` });
                        }
                    } else {
                        let formattedColor = color.startsWith('#') ? color : color.replace('#', '');
                        formattedColor = formattedColor.startsWith('0x') ? '0x' + formattedColor : formattedColor;
                        await coll.updateOne({ owner: user.id }, {
                            $set: {
                                color: formattedColor,
                                updatedAt: new Date(),
                            }
                        });
                        await role.setColors({ primaryColor: formattedColor as ColorResolvable });
                        await adminChannel.send(`${interaction.member.displayName} has changed their team color to ${formattedColor}`);
                    }
                }

                const invite = interaction.options.getString("invite");
                if (invite !== null) {
                    const inviteRegex = /^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9-]+)$/;
                    if (inviteRegex.test(invite.trim())) {
                        await coll.updateOne({ owner: user.id }, {
                            $set: {
                                invite: invite,
                                updatedAt: new Date(),
                            }
                        });
                        await adminChannel.send(`${interaction.member.displayName} has set their team server invite to ${invite}`);
                    } else {
                        await interaction.followUp({ content: `\`${invite}\` is not a valid server invite`, flags: MessageFlags.Ephemeral });
                    }
                }

                return await interaction.editReply({ content: `Set team name to ${newName ?? doc.nameProper}. Set team color to ${color ?? 'default'}. Set team server invite to ${invite ?? 'none'}.` });
            }

            case "invite": {
                if (doc === null) {
                    return await interaction.editReply('You do not own a team yet');
                }
                const addRole = interaction.guild.roles.cache.find(r => r.name === doc.nameProper);
                const newMember = interaction.options.getMember('user');
                if (!newMember || !addRole) return await interaction.editReply('Member or role could not be resolved');

                if (doc.members.includes(newMember.id)) {
                    return await interaction.editReply(`${newMember.displayName} is already in ${doc.nameProper}`);
                }

                await invites.insertOne({
                    teamId: doc._id,
                    newMember: newMember.id,
                    owner: doc.owner,
                    status: "Pending",
                    role: addRole.id,
                });

                const accept = new ButtonBuilder().setCustomId(`team-invite-${doc.owner}-${newMember.id}-accept`).setLabel('Accept Invitation').setStyle(ButtonStyle.Success);
                const deny = new ButtonBuilder().setCustomId(`team-invite-${doc.owner}-${newMember.id}-deny`).setLabel('Deny Invitation').setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(accept, deny);

                try {
                    const invitedUser = await interaction.client.users.fetch(newMember.id);
                    await invitedUser.send({ content: `${interaction.user.username} has invited you to join ${doc.nameProper}.`, components: [row] });
                } catch (error) {
                    console.error('Could not send DM:', error);
                }

                return await interaction.editReply(`Sent join request to ${newMember.displayName}`);
            }

            case "list": {
                const docs = coll.find();
                const embeds: EmbedBuilder[] = [];

                for await (const teamDoc of docs) {
                    let memberList = '';
                    for (const userId of teamDoc.members) {
                        memberList += '- ';
                        const fetchedUser = await interaction.client.users.fetch(userId);
                        memberList += fetchedUser.username;
                        if (userId === teamDoc.owner) {
                            memberList += ' (Owner)';
                        }
                        memberList += '\n';
                    }

                    let colorHex: ColorResolvable = Colors.Default;
                    if (teamDoc.color) {
                        colorHex = ('#' + teamDoc.color.replace('#', '')).toLowerCase() as ColorResolvable;
                    }

                    const inviteText = teamDoc.invite ?? 'No server invite provided';

                    const embed = new EmbedBuilder()
                        .setTitle(teamDoc.nameProper)
                        .addFields(
                            { name: 'Members:', value: memberList || 'None' },
                            { name: '\u2000', value: `Server Invite - ${inviteText}` }
                        )
                        .setColor(colorHex);

                    embeds.push(embed);
                }

                if (interaction.channel && interaction.channel.isTextBased()) {
                    await interaction.channel.send({ content: `-# List queried by <@${interaction.user.id}>`, embeds });
                }
                return await interaction.editReply('List sent');
            }

            case "transfer": {
                if (doc === null) {
                    return await interaction.editReply('You do not own a team yet');
                }
                const newOwner = interaction.options.getUser('user', true);

                const confirmButton = new ButtonBuilder()
                    .setCustomId(`confirm-transfer-${newOwner.id}-${doc.owner}`)
                    .setLabel('Transfer Ownership')
                    .setStyle(ButtonStyle.Danger);

                const cancelButton = new ButtonBuilder()
                    .setCustomId(`cancel-transfer-${newOwner.id}-${doc.owner}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary);

                const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

                return await interaction.editReply({ content: `Confirm you wish to transfer ownership of ${doc.nameProper} to ${newOwner}`, components: [confirmRow] });
            }
        }
    }
};