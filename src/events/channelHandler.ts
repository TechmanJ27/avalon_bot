import type { Client } from 'discord.js';
import { logChannelCreate, logChannelDelete, logChannelUpdate } from '../logHelpers.js';

export function registerChannelHandlers(client: Client) {
    client.on('channelCreate', (channel) => {
        logChannelCreate(channel);
    });

    client.on('channelDelete', (channel) => {
        logChannelDelete(channel);
    });

    client.on('channelUpdate', (oldChannel, newChannel) => {
        logChannelUpdate(oldChannel, newChannel);
    });
}