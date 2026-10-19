import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {getCurrentMotw, getPastWinners} from "../../database.js";


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
        ),

    async execute(interaction: ChatInputCommandInteraction) {

        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {

            case "nominate":
                const user = interaction.options.getUser("user");
                const reason = interaction.options.getUser("reason");
                if (!user) return interaction.editReply('You must provide a user to nominate');
                if (!getCurrentMotw()) return interaction.editReply("No ongoing Member of the Week vote was found.");
                if (getPastWinners(getCurrentMotw()!.id).includes({searchElement: user.id})) return interaction.editReply("Nominee cannot be a winning from the past six months");
        }
    }
}