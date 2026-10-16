import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { Guild, Invite} from "discord.js";

export const database = new DatabaseSync(fileURLToPath(new URL('../../database.db', import.meta.url)));

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
      .get(id);
}

export function getTeamMembers(id: number) {
  return database
    .prepare(`SELECT recipes.recipe_name, ingredients.ingredient_name, ingredients.amount
        FROM teams
        JOIN members ON members.team_id = teams.team_id
        WHERE team_id = ${id}`)
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
  const row = database.prepare('SELECT channel FROM logChannel WHERE id = ?').get(guildId);
  return row ? String(row.channel) : null;
}

export function invitesTable() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      inviter TEXT NOT NULL,
      uses INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      channel TEXT NOT NULL
    ) STRICT
  `);
}

export async function mostRecentInvite(guild: Guild) {
  const invites = database
      .prepare('SELECT * FROM invites')
      .all();

  // Invites will be an array of objects
  for (const obj of invites) {
    const invite = await guild.invites.fetch(String(obj.code));
      if (obj.uses !== invite.uses) return obj;
  }
}

export function newInvite(invite: Invite) {
  invite.createdAt!.toISOString();
  invite.expiresAt!.toISOString();
}
