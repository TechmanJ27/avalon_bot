import {ChatInputCommandInteraction, InteractionContextType, SlashCommandBuilder} from "discord.js";
import { setLogChannel } from "../../database.js";

export default {
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Configure the bot settings")
        .setContexts(InteractionContextType.Guild)
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

            if (!interaction.guild) {
                await interaction.reply("This command can only be used in a server.");
                return;
            }

            switch (subcommand) {
                case "log-channel":
                    const channel = interaction.options.getChannel("channel", true);

                    setLogChannel(interaction.guild.id, channel.id);

                    await interaction.reply(`Log channel has been set to ${channel}.`);
                    break;
                default:
                    await interaction.reply("Unknown subcommand.");
            }
        }
}