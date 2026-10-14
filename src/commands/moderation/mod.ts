import { AttachmentBuilder, InteractionContextType, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { addCase } from "../../database.js";
import ms from 'ms';
import {log} from "../../logHelpers.js";

export default {
    data: new SlashCommandBuilder()
        .setName("mod")
        .setDescription("Moderation commands")
        .setContexts(InteractionContextType.Guild)
        .addSubcommand(subcommand =>
            subcommand
                .setName("ban")
                .setDescription("Ban a user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to ban")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("The reason for the ban")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("tempban")
                .setDescription("Temporarily ban a user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to tempban")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("duration")
                        .setDescription("The duration of the tempban")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("The reason for the tempban")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("warn")
                .setDescription("Warn a user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to warn")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("The reason for the warning")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("unban")
                .setDescription("Unban a user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to unban")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("kick")
                .setDescription("Kick a user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to kick")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("The reason for the kick")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("purge")
                .setDescription("Purge messages")
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("The number of messages to purge (1-100)")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("unwarn")
                .setDescription("Remove a warning from a user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to remove the warning from")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("case-id")
                        .setDescription("The ID of the warning case to remove")
                        .setRequired(true)
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {

            case "ban":
                const banUser = interaction.options.getUser("user", true);
                const banReason = interaction.options.getString("reason") ?? "No reason provided";
                const banGuild = interaction.guild;

                if (!banGuild) {
                    await interaction.editReply("This command can only be used in a server.");
                    return;
                }

                const ban = await banGuild.members.ban(banUser, { reason: banReason });

                if (!ban) {
                    await interaction.editReply("Failed to ban the user.");
                    return;
                }

                await interaction.editReply(`Successfully banned ${banUser.tag}.`);
                addCase({
                    type: "ban",
                    userId: banUser.id,
                    modId: interaction.user.id,
                    guildId: banGuild.id,
                    reason: banReason,
                });
                break;

            case "tempban":
                const tempbanUser = interaction.options.getUser("user", true);
                const tempbanReason = interaction.options.getString("reason") ?? "No reason provided";
                const tempbanGuild = interaction.guild;
                const durationInput = interaction.options.getString("duration", true);
                const durationMs = ms(durationInput as any);

                if (!durationMs) {
                    return interaction.editReply(`Invalid duration format provided: "${durationInput}". Please use formats like \`1d\`, \`12h\`, or \`30m\`.`);
                }

                if (!tempbanGuild) {
                    await interaction.editReply("This command can only be used in a server.");
                    return;
                }

                const tempBan = await tempbanGuild.members.ban(tempbanUser, { reason: tempbanReason });

                if (!tempBan) {
                    await interaction.editReply("Failed to ban the user.");
                    return;
                }

                await interaction.editReply(`Successfully banned ${tempbanUser.tag}.`);
                addCase({
                    type: "tempban",
                    userId: tempbanUser.id,
                    modId: interaction.user.id,
                    guildId: tempbanGuild.id,
                    reason: tempbanReason,
                    duration: Number(durationMs),
                });
                break;

            case "warn":
                const warnUser = interaction.options.getUser("user", true);
                const warnReason = interaction.options.getString("reason") ?? "No reason provided";
                if (!interaction.guild) {
                    await interaction.editReply("This command can only be used in a server.");
                    return;
                }

                await interaction.editReply(`Successfully warned ${warnUser.tag} for: ${warnReason}`);
                break;

            case "unban":
                // TODO: Implement unban logic
                break;

            case "kick":
                // TODO: Implement kick logic
                break;

            case "purge":
                const amount = interaction.options.getInteger("amount", true);
                if (amount < 1 || amount > 100) {
                    await interaction.editReply("You can only purge between 1 and 100 messages.");
                    return;
                }

                const channel = interaction.channel;
                if (!channel || !channel.isTextBased() || channel.isDMBased()) {
                    await interaction.editReply("This command can only be used in text channels.");
                    return;
                }

                const deletedMessages = await channel.bulkDelete(amount, true);
                
                let textContent = "";
                for (const msg of deletedMessages.values()) {
                    if (!msg || !msg.author) continue;
                    textContent += `Deleted message from ${msg.author.tag}: "${msg.content}"\n`;
                }
                
                const purgedBuffer = Buffer.from(textContent, 'utf-8');
                
                const attachment = new AttachmentBuilder(purgedBuffer, { name: 'deleted-messages.txt' });
                
                await interaction.editReply({ 
                    content: 'Deleted messages:',
                    files: [attachment] 
                });

                log({type: "purge", amount: amount, channel: channel, mod: interaction.client.user.id, file: attachment}).catch(console.error);

                break;

            case "unwarn":
                // TODO: Implement unwarn logic
                break;

            default:
                await interaction.editReply("Unknown subcommand.");
        }
    }
}