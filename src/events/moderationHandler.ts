import { Events, type Client } from 'discord.js';
import { log } from '../logHelpers.js';

export function registerModerationHandlers(client: Client) {
    client.on(Events.GuildBanAdd, (ban) => {
        log({type: 'ban', ban: ban}).catch(console.error);
    });
    
    client.on(Events.GuildBanRemove, (ban) => {
        log({type: 'unban', ban: ban}).catch(console.error);
    });
}

