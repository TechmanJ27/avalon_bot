import type { Client } from 'discord.js';
import { } from '../logHelpers.js';

export function registerUserHandlers(client: Client) {
    client.on('guildMemberAdd', (member) => {
        console.log(`guildMemberAdd: ${member}`);
    });

    client.on('guildMemberRemove', (member) => {
        console.log(`guildMemberRemove: ${member}`);
    });

    client.on('guildMemberUpdate', (oldMember, newMember) => {
        console.log(`guildMemberUpdate: ${oldMember} | ${newMember}`);
    });

}
