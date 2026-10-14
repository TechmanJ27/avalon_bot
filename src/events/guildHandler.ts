import type { Client } from 'discord.js';
import { log } from '../logHelpers.js';

export function registerGuildHandlers(client: Client) {
    client.on('guildUpdate', (oldGuild, newGuild) => {
        log({ type: 'guildUpdate', oldGuild, newGuild }).catch(console.error);
    });

    client.on('inviteCreate', (invite) => {
        log({ type: 'inviteCreate', invite }).catch(console.error);
    });

    client.on('inviteDelete', (invite) => {
        log({ type: 'inviteDelete', invite }).catch(console.error);
    });

    client.on('roleCreate', (role) => {
        log({ type: 'roleCreate', role }).catch(console.error);
    });

    client.on('roleDelete', (role) => {
        log({ type: 'roleDelete', role }).catch(console.error);
    });

    client.on('roleUpdate', (oldRole, newRole) => {
        log({ type: 'roleUpdate', oldRole, newRole }).catch(console.error);
    });
}