// Imports
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")

module.exports = {
    // Slash Command Builder
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('(ADMIN) Locks the current channel')
        .addChannelOption(option => {
            option
                .setName('channel')
                .setDescription('Choose a channel to lock.');
            return option;
        })
        .addBooleanOption(option => {
            option
                .setName('unlock')
                .setDescription('Unlocks the target channel instead');
            return option;
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {

        // Fetch MongoDB doc
        const doc = interaction.client.mongo.db("avalon").collection("locked");

        // Helper functions
        function lockedQuery(channel) {
            const filter = { channelId: channel.id };
            return doc.findOne(filter);
        }

        function deleteLock(channel) {
            const filter = { channelId: channel.id };
            return doc.deleteOne(filter);
        }

        // Function to toggle locked state
        async function toggle(state, channel) {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                [PermissionFlagsBits.SendMessages]: state,
                [PermissionFlagsBits.CreatePublicThreads]: state,
                [PermissionFlagsBits.CreatePrivateThreads]: state
            });
        }


        async function lock(channel, unlock) {
            if (unlock === false || unlock === null || unlock === undefined) {
                await toggle(false, channel);
                await doc.insertOne({channelId: channel.id});
                return interaction.reply({content: 'Channel locked.'});
            } else {
                if (await lockedQuery(channel)) {
                    await toggle(true, channel);
                    await deleteLock(channel);
                    return interaction.reply({content: 'Channel unlocked.'});
                } else {
                    return interaction.reply({content: 'Channel is not locked.'});
                }
            }
        }

        // Fetch inputs
        const channel = interaction.options.getChannel('channel');
        const unlock = interaction.options.getBoolean('unlock');

        // Lock/Unlock channel
        if(channel === null || channel === undefined) {
            await lock(interaction.channel, unlock, doc);
        } else {
            await lock(channel, unlock, doc);
        }

    }
}