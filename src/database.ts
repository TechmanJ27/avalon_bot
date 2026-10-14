import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

export const database = new DatabaseSync(fileURLToPath(new URL('../../database.db', import.meta.url)));

export function warsTable() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS wars (
    id INTEGER PRIMARY KEY,
    value TEXT
    ) STRICT
  `);
}

export function getWarById(id: number) {
  return database
      .prepare('SELECT * FROM wars WHERE id = ?')
      .get(id);
}

export function teamsTable() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY,
      value TEXT
    ) STRICT
  `);
}

export function getTeamById(id: number) {
  return database
      .prepare('SELECT * FROM teams WHERE id = ?')
      .get(id);
}

export function casesTable() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      mod_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      reason TEXT DEFAULT 'No reason provided',
      dm_success INTEGER NOT NULL DEFAULT 0,
      duration INTEGER DEFAULT NULL,
      created_at INTEGER NOT NULL
    ) STRICT
  `);
}

export type CaseType = 'ban' | 'tempban' | 'warn' | 'unban' | 'kick' | 'unwarn';

export interface NewCase {
  type: CaseType;
  userId: string;
  modId: string;
  guildId: string;
  reason?: string | null;
  dmSuccess?: boolean;
  duration?: number | null;
}

export function addCase({ type, userId, modId, guildId, reason, dmSuccess = false, duration = null }: NewCase): number {
  const result = database
    .prepare(
      'INSERT INTO cases (type, user_id, mod_id, guild_id, reason, dm_success, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(type, userId, modId, guildId, reason ?? 'No reason provided', dmSuccess ? 1 : 0, duration, Date.now());

  return Number(result.lastInsertRowid);
}

export function getCasesForUser(guildId: string, userId: string) {
  return database
      .prepare('SELECT * FROM cases WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC')
      .all(guildId, userId);
}

export function getCasesForGuild(guildId: string) {
  return database
      .prepare('SELECT * FROM cases WHERE guild_id = ? ORDER BY created_at DESC')
      .all(guildId);
}

export function getCaseById(caseId: number) {
  return database
      .prepare('SELECT * FROM cases WHERE id = ?')
      .get(caseId);
}

export function configTable() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS logChannel (
      id INTEGER PRIMARY KEY,
      channel STRING NOT NULL
    ) STRICT
  `);
}

export function setLogChannel(guildId: string, channelId: string) {
  database
      .prepare(
          'INSERT INTO logChannel (id, channel) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET channel = excluded.channel'
      )
      .run(guildId, channelId);
}

export function getLogChannel(guildId: string): string | null {
  const row = database.prepare('SELECT channel FROM logChannel WHERE id = ?').get(guildId);
  return row ? String(row.channel) : null;
}