import type { Guild, Invite } from 'discord.js';
import {
    deleteInvite,
    getStoredInvites,
    transaction,
    upsertInvite,
    type InviteRow,
} from './database.js';

export interface UsedInvite {
    code: string;
    inviterId: string | null;
    uses: number;
}

function toRow(guildId: string, invite: Invite): InviteRow {
    return {
        guild_id: guildId,
        code: invite.code,
        inviter_id: invite.inviterId ?? null,
        channel_id: invite.channelId ?? null,
        uses: invite.uses ?? 0,
        max_uses: invite.maxUses ?? 0,
        created_at: invite.createdTimestamp ?? null,
        expires_at: invite.expiresTimestamp ?? null,
    };
}

const queues = new Map<string, Promise<unknown>>();

function serialize<T>(guildId: string, fn: () => Promise<T>): Promise<T> {
    const previous = queues.get(guildId) ?? Promise.resolve();
    const next = previous.catch(() => {}).then(fn);
    queues.set(guildId, next);
    return next;
}

function syncGuildInvites(guildId: string, current: Iterable<Invite>, existingCodes: Iterable<string>) {
    const liveCodes = new Set<string>();
    transaction(() => {
        for (const invite of current) {
            liveCodes.add(invite.code);
            upsertInvite(toRow(guildId, invite));
        }
        for (const code of existingCodes) {
            if (!liveCodes.has(code)) deleteInvite(guildId, code);
        }
    });
}

export function seedInvites(guild: Guild): Promise<void> {
    return serialize(guild.id, async () => {
        const current = await guild.invites.fetch();
        const stored = getStoredInvites(guild.id);
        syncGuildInvites(guild.id, current.values(), stored.map((r) => r.code));
    });
}

export function trackInvite(invite: Invite) {
    const guildId = invite.guild?.id;
    if (!guildId) return;
    upsertInvite(toRow(guildId, invite));
}

export function mostRecentInvite(guild: Guild): Promise<UsedInvite | null> {
    return serialize(guild.id, async () => {
        const current = await guild.invites.fetch();
        const stored = getStoredInvites(guild.id);
        const storedByCode = new Map(stored.map((r) => [r.code, r]));

        let used: UsedInvite | null = null;

        for (const invite of current.values()) {
            const before = storedByCode.get(invite.code);
            if ((invite.uses ?? 0) > (before?.uses ?? 0)) {
                used = { code: invite.code, inviterId: invite.inviterId ?? null, uses: invite.uses ?? 0 };
                break;
            }
        }

        if (!used) {
            const now = Date.now();
            const candidates = stored.filter(
                (r) =>
                    !current.has(r.code) &&
                    r.max_uses > 0 &&
                    r.uses === r.max_uses - 1 &&
                    !(r.expires_at && r.expires_at <= now),
            );
            if (candidates.length === 1) {
                const [row] = candidates;
                used = { code: row.code, inviterId: row.inviter_id, uses: row.max_uses };
            }
        }

        syncGuildInvites(guild.id, current.values(), stored.map((r) => r.code));

        return used;
    });
}