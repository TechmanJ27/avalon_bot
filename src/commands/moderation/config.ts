import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Configure the bot settings")
        .addSubcommand(subcommand =>
            subcommand
                .setName("log-channel")
                .setDescription("Set the log channel")
                .addChannelOption(option =>
                    option.setName("channel")
                        .setDescription("The new log channel for the bot")
                        .setRequired(true)
                )
        ),

        async execute(interaction: ChatInputCommandInteraction) {
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case "log-channel":
                    const channel = interaction.options.getChannel("channel", true);
                    
                    

                    await interaction.reply(`Log channel has been set to ${channel}.`);
                    break;
                default:
                    await interaction.reply("Unknown subcommand.");
            }
        }
}