import type { Client } from 'discord.js';
import { logBan, logUnban } from '../logHelpers.js';
import { addCase } from '../database.js';

export function registerModerationHandlers(client: Client) {
    client.on('guildBanAdd', (ban) => {
        logBan(ban);
        addCase('ban', ban)
    });

    client.on('guildBanRemove', (ban) => {
        logUnban(ban);

    });
}

