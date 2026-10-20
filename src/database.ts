import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

export const database = new DatabaseSync(fileURLToPath(new URL('../database.db', import.meta.url)));

database.exec('PRAGMA foreign_keys = ON;');

export function transaction<T>(fn: () => T): T {
  database.exec('BEGIN');
  try {
    const result = fn();
    database.exec('COMMIT');
    return result;
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

export function warsTable() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS wars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL,
      attacking TEXT NOT NULL,
      defendingTeam TEXT NOT NULL,
      reason TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT NOT NULL,
      requestedAt TEXT NOT NULL
    ) STRICT
  `);
}

export function teamsTable() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nameProper TEXT NOT NULL,
      owner TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS members (
      user_id TEXT NOT NULL,
      team_id INTEGER NOT NULL,
      position TEXT NOT NULL,
      PRIMARY KEY (team_id, user_id),
      FOREIGN KEY(team_id) REFERENCES teams(id)
      ) STRICT
  `);
}

export function getTeamById(id: number) {
  return database
      .prepare('SELECT * FROM teams WHERE id = ?')
      .get(id) as Record<string, any> | undefined;
}

export function getTeamMembers(teamId: number) {
  return database
      .prepare('SELECT user_id, position FROM members WHERE team_id = ?')
      .all(teamId) as Record<string, any>[];
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
      .all(guildId, userId) as Record<string, any>[];
}

export function getCasesForGuild(guildId: string) {
  return database
      .prepare('SELECT * FROM cases WHERE guild_id = ? ORDER BY created_at DESC')
      .all(guildId) as Record<string, any>[];
}

export function getCaseById(caseId: number) {
  return database
      .prepare('SELECT * FROM cases WHERE id = ?')
      .get(caseId) as Record<string, any> | undefined;
}

export function configTable() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS logChannel (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL
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
  const row = database
      .prepare('SELECT channel FROM logChannel WHERE id = ?')
      .get(guildId) as { channel: string } | undefined; // Safe cast

  return row ? String(row.channel) : null; // Now won't crash if empty
}

export interface InviteRow {
  guild_id: string;
  code: string;
  inviter_id: string | null;
  channel_id: string | null;
  uses: number;
  max_uses: number;
  created_at: number | null;
  expires_at: number | null;
}

export function invitesTable() {
  const columns = database.prepare('PRAGMA table_info(invites)').all() as { name: string }[];
  if (columns.length && !columns.some((c) => c.name === 'guild_id')) {
    database.exec('DROP TABLE invites');
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS invites (
      guild_id TEXT NOT NULL,
      code TEXT NOT NULL,
      inviter_id TEXT,
      channel_id TEXT,
      uses INTEGER NOT NULL DEFAULT 0,
      max_uses INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER,
      expires_at INTEGER,
      PRIMARY KEY (guild_id, code)
    ) STRICT
  `);
}

export function getStoredInvites(guildId: string): InviteRow[] {
  return database
      .prepare('SELECT * FROM invites WHERE guild_id = ?')
      .all(guildId) as unknown as InviteRow[];
}

export function upsertInvite(row: InviteRow) {
  database
      .prepare(`
        INSERT INTO invites (guild_id, code, inviter_id, channel_id, uses, max_uses, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(guild_id, code) DO UPDATE SET
          inviter_id = excluded.inviter_id,
          channel_id = excluded.channel_id,
          uses = excluded.uses,
          max_uses = excluded.max_uses,
          created_at = excluded.created_at,
          expires_at = excluded.expires_at
      `)
      .run(row.guild_id, row.code, row.inviter_id, row.channel_id, row.uses, row.max_uses, row.created_at, row.expires_at);
}

export function deleteInvite(guildId: string, code: string) {
  database
      .prepare('DELETE FROM invites WHERE guild_id = ? AND code = ?')
      .run(guildId, code);
}

export function motwTable() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS motws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      winner TEXT,
      winner_reason TEXT,
      started TEXT NOT NULL,
      ended TEXT
    ) STRICT
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS nominations (
      nominator TEXT NOT NULL,
      motw_id INTEGER NOT NULL,
      nominee TEXT NOT NULL,
      reason TEXT,
      PRIMARY KEY (nominator, motw_id),
      FOREIGN KEY(motw_id) REFERENCES motws(id)
      ) STRICT
  `);
}

export function getCurrentMotw() {
  return database
      .prepare(`SELECT id FROM motws ORDER BY id DESC LIMIT 1`)
      .get() as { id: number } | undefined;
}

export function getCurrentNominations(current: number) {
  return database
      .prepare('SELECT nominator, nominee, reason FROM nominations WHERE motw_id = ?')
      .all(current) as Record<string, any>[];
}

export function getPastWinners(current: number) {
  return database
      .prepare('SELECT winner FROM motws WHERE id != ? AND ended > ?')
      .all(current, new Date().toISOString()) as Record<string, any>[];
}

export function addNomination(nominator: string, nominee: string, reason: string | null = null) {
  const currentMotw = getCurrentMotw();

  if (!currentMotw) {
    throw new Error("No active Member of the Week session found to nominate for.");
  }

  return database
      .prepare('INSERT INTO nominations (nominator, motw_id, nominee, reason) VALUES (?, ?, ?, ?)')
      .run(nominator, currentMotw.id, nominee, reason);
}

export function newMotw() {

  return database
      .prepare('INSERT INTO motws (started) VALUES (?)')
      .run(new Date().toISOString());
}