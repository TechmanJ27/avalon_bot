import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {GuildBan} from "discord.js";

const database = new DatabaseSync(fileURLToPath(new URL('../../database.db', import.meta.url)));

export function newWar() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS wars (
    key INTEGER PRIMARY KEY,
    value TEXT
    ) STRICT
  `);
}

export function newTeam() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      key INTEGER PRIMARY KEY,
      value TEXT
    ) STRICT
  `);
}

export function newCases() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      mod_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      reason TEXT,
      dm_success BOOLEAN,
      created_at INTEGER NOT NULL
    ) STRICT
  `);
}

export function addCase(type: string, ban: GuildBan) {
  database
      .prepare(
          'INSERT INTO cases (type, user_id, mod_id, guild_id, reason, dm_success, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(type, ban.user.id, ban.user.id, ban.guild.id, ban.reason ?? null, null, Date.now());
}