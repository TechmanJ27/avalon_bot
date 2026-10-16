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
const seeded = new Set<string>();

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
        seeded.add(guild.id);
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
        const storedCodes = stored.map((r) => r.code);

        if (!seeded.has(guild.id)) {
            syncGuildInvites(guild.id, current.values(), storedCodes);
            seeded.add(guild.id);
            return null;
        }

        const storedByCode = new Map(stored.map((r) => [r.code, r]));
        const changed = [...current.values()].filter(
            (invite) => (invite.uses ?? 0) > (storedByCode.get(invite.code)?.uses ?? 0),
        );

        let used: UsedInvite | null = null;

        if (changed.length === 1) {
            const [invite] = changed;
            used = { code: invite.code, inviterId: invite.inviterId ?? null, uses: invite.uses ?? 0 };
        } else if (changed.length === 0) {
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

        syncGuildInvites(guild.id, current.values(), storedCodes);

        return used;
    });
}