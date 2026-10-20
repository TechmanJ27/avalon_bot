import {ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import {addNomination, getCurrentMotw, getCurrentNominations, getPastWinners, newMotw} from "../../database.js";

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
                .addUserOption(option =>
                    option
                        .setName("reason")
                        .setDescription('The reason for the nomination')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("about")
                .setDescription('Info about Avalon\'s Member of the Week')
        ),

    async execute(interaction: ChatInputCommandInteraction) {

        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {

            case "nominate":
                const user = interaction.options.getUser("user");
                const reason = interaction.options.getString("reason");

                if (!user) return interaction.editReply('You must provide a user to nominate');
                if (user == interaction.user) return interaction.editReply('You cannot nominate yourself');

                if (!getCurrentMotw()) return interaction.editReply("No ongoing Member of the Week vote was found.");
                if (getPastWinners(getCurrentMotw()!.id).includes({searchElement: user.id})) return interaction.editReply("Nominee cannot be a winning member from the past six months");

                const nominations = getCurrentNominations(getCurrentMotw()!.id);

                for (const nomination of nominations) {
                    if (nomination.nominator === user.id) return interaction.editReply("You can only nominate one user");
                }

                const nominationEmbed = new EmbedBuilder()
                    .setTitle("Member of the Week Nomination")
                    .setDescription(`Nomination for <$${user.id}> from <@${interaction.user.id}> with reason ${reason}`);

                const channel = await interaction.client.channels.fetch('1532850263306535124');

                if (!channel) return interaction.editReply('Channel failed to fetch');

                addNomination(interaction.user.id, user.id, reason);

                if (channel.isSendable()) {
                    await channel.send({embeds: [nominationEmbed]});
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
                        {name: 'How it works', value: 'Members of the community can nominate a user weekly'},
                        {name: '', value: ''}
                    );

                if (interaction.channel!.isSendable()) await interaction.channel.send({embeds: [aboutEmbed]});
                break;

            case "new":

                try {

                    newMotw();
                    await interaction.editReply('New Member of the Week created successfully.');
                } catch (error) {

                    console.log(error);
                }
        }
    }
}