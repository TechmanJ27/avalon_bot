import type { Client } from 'discord.js';
import { } from '../logHelpers.js';

export function registerMessageHandlers(client: Client) {
    client.on('messageUpdate', (oldMessage, newMessage) => {
        console.log(`messageUpdate: ${oldMessage} | ${newMessage}`);
    });
}