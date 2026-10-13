client.on('channelCreate', (channel) => {
    logChannelCreate(channel);
});

client.on('channelDelete', (channel) => {
    logChannelDelete(channel);
});

client.on('channelUpdate', (oldChannel, newChannel) => {
    logChannelUpdate(oldChannel, newChannel);
});
