import type { Client } from 'discord.js';
import { log } from '../logHelpers.js';

export function registerMessageHandlers(client: Client) {
    client.on('messageUpdate', (oldMessage, newMessage) => {
        log({ type: 'messageUpdate', oldMessage, newMessage }).catch(console.error);
    });
}