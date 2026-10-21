import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import {
    addNomination,
    deleteNomination,
    getCurrentMotw,
    getNominationByUser,
    getPastWinners,
    newMotw
} from "../../database.js";

const MOTW_CHANNEL_ID = process.env.MOTW_CHANNEL_ID ?? '1532850263306535124';
const DUPLICATE_PRIMARY_KEY_CODE = 1555;

async function fetchAnnouncementChannel(interaction: ChatInputCommandInteraction) {
    const channel = await interaction.client.channels.fetch(MOTW_CHANNEL_ID).catch(() => null);
    if (!channel || !channel.isSendable()) return null;
    return channel;
}

function isDuplicateNomination(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const code = (error as { errcode?: number }).errcode;
    return code === DUPLICATE_PRIMARY_KEY_CODE || error.message.includes('UNIQUE constraint failed');
}

async function handleNominate(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason");

    if (user.id === interaction.user.id) return interaction.editReply('You cannot nominate yourself');
    if (user.bot) return interaction.editReply('You cannot nominate a bot');

    const current = getCurrentMotw();
    if (!current) return interaction.editReply('No ongoing Member of the Week cycle was found.');

    if (getPastWinners(current.id).some(n => n.winner === user.id)) {
        return interaction.editReply('Nominee cannot be a winning member from the past six months');
    }

    const channel = await fetchAnnouncementChannel(interaction);
    if (!channel) return interaction.editReply('The announcement channel is unavailable, so your nomination was not submitted.');

    try {
        addNomination(interaction.user.id, user.id, reason);
    } catch (error: unknown) {
        if (isDuplicateNomination(error)) {
            return interaction.editReply('You have already submitted a nomination for this Member of the Week cycle!');
        }

        console.error(error);
        return interaction.editReply('An error occurred while processing your nomination.');
    }

    const nominationEmbed = new EmbedBuilder()
        .setTitle('Member of the Week Nomination')
        .setDescription(`Nomination for <@${user.id}> from <@${interaction.user.id}>`)
        .setColor(Colors.Green);

    if (reason !== null) nominationEmbed.addFields({ name: 'Reason', value: reason });

    try {
        await channel.send({ embeds: [nominationEmbed] });
        return interaction.editReply('Your nomination for this cycle has been submitted!');
    } catch (error) {
        console.error(error);
        return interaction.editReply('Your nomination was saved, but the announcement could not be posted.');
    }
}

async function handleAbout(interaction: ChatInputCommandInteraction) {
    const aboutEmbed = new EmbedBuilder()
        .setTitle("All about Avalon's Member of the Week")
        .setDescription("Avalon's Member of the Week system is a way to reward activity and contribution to the community.")
        .addFields(
            { name: 'How it works', value: "Members of the community can nominate a user weekly to become next week's Member of the Week." },
            { name: 'Associated commands', value: '`/motw`' }
        );

    return interaction.editReply({ embeds: [aboutEmbed] });
}

async function handleNew(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply('You do not have permission to use this command. Administrator required.');
    }

    try {
        newMotw();
        return interaction.editReply('New Member of the Week created successfully.');
    } catch (error) {
        console.error(error);
        return interaction.editReply('An error occurred while starting a new Member of the Week.');
    }
}

async function handleRevoke(interaction: ChatInputCommandInteraction) {
    const nomination = getNominationByUser(interaction.user.id);
    if (!nomination) return interaction.editReply('Could not find a nomination under this user');

    deleteNomination(nomination.nominator, nomination.motw_id);

    const revokeEmbed = new EmbedBuilder()
        .setTitle('Member of the Week Nomination Revoked')
        .setDescription(`Nomination for <@${nomination.nominee}> from <@${nomination.nominator}>`)
        .setColor(Colors.Red);

    const channel = await fetchAnnouncementChannel(interaction);
    if (channel) {
        try {
            await channel.send({ embeds: [revokeEmbed] });
        } catch (error) {
            console.error(error);
        }
    }

    return interaction.editReply(`Your nomination for <@${nomination.nominee}> was successfully revoked`);
}

export default {
    data: new SlashCommandBuilder()
        .setName("motw")
        .setDescription('Member of the Week')
        .addSubcommand(subcommand =>
            subcommand
                .setName("nominate")
                .setDescription('Nominate someone for Member of the Week')
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription('The user to nominate')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("reason")
                        .setDescription('The reason for the nomination')
                        .setMaxLength(1024)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("about")
                .setDescription("Info about Avalon's Member of the Week")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("new")
                .setDescription('Start a new motw')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("revoke")
                .setDescription('Revoke your nomination')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        switch (interaction.options.getSubcommand()) {
            case "nominate":
                return handleNominate(interaction);
            case "about":
                return handleAbout(interaction);
            case "new":
                return handleNew(interaction);
            case "revoke":
                return handleRevoke(interaction);
        }
    }
}