import {ChatInputCommandInteraction, Colors, EmbedBuilder, MessageFlags, SlashCommandBuilder} from "discord.js";
import {
    addNomination,
    deleteNomination,
    getCurrentMotw,
    getNominationByUser,
    getPastWinners,
    newMotw
} from "../../database.js";

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
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("about")
                .setDescription('Info about Avalon\'s Member of the Week')
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

        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        const subcommand = interaction.options.getSubcommand();

        const channel = await interaction.client.channels.fetch('1532850263306535124');
        if (!channel) return interaction.editReply('Channel failed to fetch');

        switch (subcommand) {

            case "nominate":
                const user = interaction.options.getUser("user");
                const reason = interaction.options.getString("reason");

                if (!user) return interaction.editReply('You must provide a user to nominate');
                if (user == interaction.user) return interaction.editReply('You cannot nominate yourself');

                if (!getCurrentMotw()) return interaction.editReply("No ongoing Member of the Week cycle was found.");
                if (getPastWinners(getCurrentMotw()!.id).some(n => n.winner === user.id)) return interaction.editReply("Nominee cannot be a winning member from the past six months");

                const nominationEmbed = new EmbedBuilder()
                    .setTitle("Member of the Week Nomination")
                    .setDescription(`Nomination for <@${user.id}> from <@${interaction.user.id}>`)
                    .setColor(Colors.Green);

                if (reason !== null) nominationEmbed.addFields({name: 'Reason', value: reason})

                try {
                    addNomination(interaction.user.id, user.id, reason);
                } catch (error: any) {
                    if (error.code === 'ERR_SQLITE_ERROR' && error.message.includes('UNIQUE constraint failed')) {
                        return await interaction.editReply("You have already submitted a nomination for this Member of the Week cycle!");
                    }

                    console.error(error);
                    await interaction.reply({ content: "An error occurred while processing your nomination.", ephemeral: true });
                }

                if (channel.isSendable()) {

                    await channel.send({embeds: [nominationEmbed]});
                    await interaction.editReply('Your nomination for this cycle has been submitted!');
                } else {

                    console.log(nominationEmbed);
                    console.log(channel);
                }
                break;

            case "about":
                const aboutEmbed = new EmbedBuilder()
                    .setTitle("All about Avalon\'s Member of the Week")
                    .setDescription('Avalon\'s Member of the Week system is a way to reward activity and contribution to the community.')
                    .addFields(
                        {name: 'How it works', value: 'Members of the community can nominate a user weekly to become next weeks member of the week.'},
                        {name: 'Associated commands', value: '`/motw`'}
                    );

                if (interaction.channel!.isSendable()) await interaction.editReply({embeds: [aboutEmbed]});
                break;

            case "new":
                if (!interaction.memberPermissions || !interaction.memberPermissions.has('Administrator')) {
                    return interaction.editReply('You do not have permission to use this command. Administrator required.');
                }

                try {
                    newMotw();
                    await interaction.editReply('New Member of the Week created successfully.');
                } catch (error) {
                    console.error(error);
                    await interaction.editReply('An error occurred while starting a new Member of the Week.');
                }
                break;

            case "revoke":
                const nomination = getNominationByUser(interaction.user.id);

                if (!nomination || !nomination.nominator || !nomination.id) return interaction.editReply('Could not find a nomination under this user');

                deleteNomination(String(nomination.nominator), Number(nomination.id));

                await interaction.editReply(`Your nomination for <@${nomination.nominee}> was successfully revoked`);

                const revokeEmbed = new EmbedBuilder()
                    .setTitle("Member of the Week Nomination Revoked")
                    .setDescription(`Nomination for <@${nomination.nominee}> from <@${nomination.nominator}>`)
                    .setColor(Colors.Red);

                if (channel.isSendable()) {

                    await channel.send({embeds: [revokeEmbed]});
                    await interaction.editReply('Your nomination for this cycle has been submitted!');
                } else {

                    console.log(revokeEmbed);
                    console.log(channel);
                }
                break;
        }
    }
}