import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    TextChannel
} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('(ADMIN) Locks the current channel')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Choose a channel to lock.')
        )
        .addBooleanOption(option =>
            option
                .setName('unlock')
                .setDescription('Unlocks the target channel instead')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction: ChatInputCommandInteraction) {

        const doc = interaction.client.mongo.db("avalon").collection("locked");

        function lockedQuery(channel: TextChannel) {
            const filter = { channelId: channel.id };
            return doc.findOne(filter);
        }

        function deleteLock(channel: TextChannel) {
            const filter = { channelId: channel.id };
            return doc.deleteOne(filter);
        }

        async function toggle(state: boolean, channel: TextChannel) {
            await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
                SendMessages: state,
                CreatePublicThreads: state,
                CreatePrivateThreads: state
            });
        }

        async function lock(channel: TextChannel, unlock: boolean | null) {
            if (!unlock) {
                await toggle(false, channel);
                await doc.insertOne({ channelId: channel.id });
                return interaction.reply({ content: 'Channel locked.' });
            } else {
                if (await lockedQuery(channel)) {
                    await toggle(true, channel);
                    await deleteLock(channel);
                    return interaction.reply({ content: 'Channel unlocked.' });
                } else {
                    return interaction.reply({ content: 'Channel is not locked.' });
                }
            }
        }

        const targetChannel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;
        const unlock = interaction.options.getBoolean('unlock');

        if (!targetChannel || !('permissionOverwrites' in targetChannel)) {
            return interaction.reply({ content: 'This channel cannot be locked.', ephemeral: true });
        }

        await lock(targetChannel, unlock);
    }
}