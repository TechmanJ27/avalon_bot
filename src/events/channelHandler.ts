import { Events, type Client } from 'discord.js';
import { log } from '../logHelpers.js';

export function registerChannelHandlers(client: Client) {
    client.on(Events.ChannelCreate, channel => log({ type: "channelCreate", channel }));
    client.on(Events.ChannelDelete, channel => {
        if (channel.isDMBased()) return;
        log({ type: "channelDelete", channel });
    });
    client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
    if (oldChannel.isDMBased() || newChannel.isDMBased()) return;
    if (newChannel.id === '1551385245046276096') return;
    log({ type: "channelUpdate", oldChannel, newChannel });
    });
}