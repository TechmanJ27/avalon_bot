import type { Client } from 'discord.js';
import { } from '../logHelpers.js';

export function registerGuildHandlers(client: Client) {
    client.on('guildUpdate', (oldGuild, newGuild) => {
        console.log(`guildUpdate: ${oldGuild} | ${newGuild}`);
    });

    client.on('inviteCreate', (invite) => {
        console.log(`inviteCreate: ${invite}`);
    });

    client.on('inviteDelete', (invite) => {
        console.log(`inviteDelete: ${invite}`);
    });

    client.on('roleCreate', (role) => {
        console.log(`roleCreate: ${role}`);
    });

    client.on('roleDelete', (role) => {
        console.log(`roleDelete: ${role}`);
    });

    client.on('roleUpdate', (oldRole, newRole) => {
        console.log(`roleUpdate: ${oldRole} | ${newRole}`);
    });

}