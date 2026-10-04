declare module "discord.js"

import { Collection } from 'discord.js';
import { Db } from 'mongodb';

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, any>;
        cooldowns: Collection<string, Collection<string, number>>;
        mongo: {
            db(name: "avalon"): Db;
            [key: string]: any;
        };
    }
}