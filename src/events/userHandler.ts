import type { Client } from 'discord.js';
import { log } from '../logHelpers.js';

export function registerUserHandlers(client: Client) {
    client.on('guildMemberAdd', (member) => {
        log({ type: 'memberAdd', member }).catch(console.error);
    });

    client.on('guildMemberRemove', (member) => {
        log({ type: 'memberRemove', member }).catch(console.error);
    });

    client.on('guildMemberUpdate', (oldMember, newMember) => {
        log({ type: 'memberUpdate', oldMember, newMember }).catch(console.error);
    });
}
