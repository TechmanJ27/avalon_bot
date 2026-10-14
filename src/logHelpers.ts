import {
  Colors,
  EmbedBuilder,
  type Guild,
  type GuildBan,
  type GuildMember,
  type Invite,
  type Message,
  type NonThreadGuildBasedChannel,
  type PartialGuildMember,
  type PartialMessage,
  type Role,
} from "discord.js";
import { getLogChannel } from "./database.js";

export type LogEvent =
    | { type: "channelCreate"; channel: NonThreadGuildBasedChannel }
    | { type: "channelDelete"; channel: NonThreadGuildBasedChannel }
    | { type: "channelUpdate"; oldChannel: NonThreadGuildBasedChannel; newChannel: NonThreadGuildBasedChannel }
    | { type: "ban"; ban: GuildBan }
    | { type: "unban"; ban: GuildBan }
    | { type: "memberAdd"; member: GuildMember }
    | { type: "memberRemove"; member: GuildMember | PartialGuildMember }
    | { type: "memberUpdate"; oldMember: GuildMember | PartialGuildMember; newMember: GuildMember }
    | { type: "messageDelete"; message: Message | PartialMessage }
    | { type: "messageUpdate"; oldMessage: Message | PartialMessage; newMessage: Message | PartialMessage }
    | { type: "guildUpdate"; oldGuild: Guild; newGuild: Guild }
    | { type: "inviteCreate"; invite: Invite }
    | { type: "inviteDelete"; invite: Invite }
    | { type: "roleCreate"; role: Role }
    | { type: "roleDelete"; role: Role }
    | { type: "roleUpdate"; oldRole: Role; newRole: Role };

const trunc = (s: string | null | undefined, max = 1000): string => {
  if (!s) return "*(empty)*";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const ts = (ms: number) => `<t:${Math.floor(ms / 1000)}:f>`;

function resolveInviteGuild(invite: Invite): Guild | null {
  if (!invite.guild) return null;
  return invite.client.guilds.cache.get(invite.guild.id) ?? null;
}

function buildEmbed(event: LogEvent): { guild: Guild; embed: EmbedBuilder } | null {
  const embed = new EmbedBuilder().setTimestamp();

  switch (event.type) {
    case "channelCreate":
      return {
        guild: event.channel.guild,
        embed: embed.setColor(Colors.Green).setTitle("Channel created")
            .setDescription(`${event.channel} (\`${event.channel.name}\`)`),
      };

    case "channelDelete":
      return {
        guild: event.channel.guild,
        embed: embed.setColor(Colors.Red).setTitle("Channel deleted")
            .setDescription(`\`${event.channel.name}\``),
      };

    case "channelUpdate": {
      const { oldChannel, newChannel } = event;
      const changes: string[] = [];
      if (oldChannel.name !== newChannel.name) {
        changes.push(`Name: \`${oldChannel.name}\` → \`${newChannel.name}\``);
      }
      if (oldChannel.parentId !== newChannel.parentId) {
        changes.push(`Category: <#${oldChannel.parentId ?? "none"}> → <#${newChannel.parentId ?? "none"}>`);
      }
      return {
        guild: newChannel.guild,
        embed: embed.setColor(Colors.Yellow).setTitle("Channel updated")
            .setDescription(`${newChannel}\n${changes.join("\n") || "Other settings changed"}`),
      };
    }

    case "ban":
    case "unban": {
      const banned = event.type === "ban";
      return {
        guild: event.ban.guild,
        embed: embed.setColor(banned ? Colors.Red : Colors.Green)
            .setTitle(banned ? "User banned" : "User unbanned")
            .setDescription(`${event.ban.user.tag} (${event.ban.user.id})`)
            .addFields({ name: "Reason", value: event.ban.reason ?? "No reason provided" }),
      };
    }

    case "memberAdd": {
      const { member } = event;
      return {
        guild: member.guild,
        embed: embed.setColor(Colors.Green).setTitle("Member joined")
            .setDescription(`${member} (${member.user.tag}, ${member.id})`)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields({ name: "Account created", value: ts(member.user.createdTimestamp) }),
      };
    }

    case "memberRemove": {
      const { member } = event;
      const tag = member.user?.tag ?? "Unknown user";
      const roles = member.partial
          ? null
          : member.roles.cache.filter((r) => r.id !== member.guild.id).map((r) => r.toString());
      embed.setColor(Colors.Red).setTitle("Member left")
          .setDescription(`${tag} (${member.id})`);
      if (roles?.length) embed.addFields({ name: "Roles", value: trunc(roles.join(", ")) });
      return { guild: member.guild, embed };
    }

    case "memberUpdate": {
      const { oldMember, newMember } = event;
      if (oldMember.partial) return null;

      const changes: string[] = [];

      if (oldMember.nickname !== newMember.nickname) {
        changes.push(`Nickname: \`${oldMember.nickname ?? "none"}\` → \`${newMember.nickname ?? "none"}\``);
      }

      const added = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
      const removed = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));
      if (added.size) changes.push(`Roles added: ${added.map((r) => r.toString()).join(", ")}`);
      if (removed.size) changes.push(`Roles removed: ${removed.map((r) => r.toString()).join(", ")}`);

      if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
        const until = newMember.communicationDisabledUntilTimestamp;
        changes.push(`Timeout: ${until ? `until ${ts(until)}` : "removed"}`);
      }

      if (!changes.length) return null;

      return {
        guild: newMember.guild,
        embed: embed.setColor(Colors.Yellow).setTitle("Member updated")
            .setDescription(`${newMember} (${newMember.user.tag})\n${changes.join("\n")}`),
      };
    }

    case "messageUpdate": {
      const { oldMessage, newMessage } = event;
      if (!newMessage.guild) return null; // DMs
      if (newMessage.author?.bot) return null;
      if (oldMessage.content !== null && oldMessage.content === newMessage.content) return null;

      embed.setColor(Colors.Yellow).setTitle("Message edited")
          .setDescription(
              `${newMessage.author ?? "Unknown author"} in ${newMessage.channel}\n[Jump to message](${newMessage.url})`,
          )
          .addFields(
              { name: "Before", value: oldMessage.content === null ? "*(not cached)*" : trunc(oldMessage.content) },
              { name: "After", value: trunc(newMessage.content) },
          );
      return { guild: newMessage.guild, embed };
    }

    case "messageDelete": {
      const {message} = event;
      if (!message.guild) return null;

      embed.setColor(Colors.Red).setTitle("Message Deleted")
          .setDescription(
              `${message.author ?? "Unknown author"} in ${message.channel}`,
          )
          .addFields(
              {name: "Content", value: message.content === null ? "*(not cached)*" : trunc(message.content)},
          );
      return {guild: message.guild, embed};
    }

    case "guildUpdate": {
      const { oldGuild, newGuild } = event;
      const changes: string[] = [];
      if (oldGuild.name !== newGuild.name) {
        changes.push(`Name: \`${oldGuild.name}\` → \`${newGuild.name}\``);
      }
      if (oldGuild.icon !== newGuild.icon) changes.push("Icon changed");
      if (oldGuild.banner !== newGuild.banner) changes.push("Banner changed");
      if (oldGuild.ownerId !== newGuild.ownerId) {
        changes.push(`Owner: <@${oldGuild.ownerId}> → <@${newGuild.ownerId}>`);
      }
      if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
        changes.push(`Verification level: ${oldGuild.verificationLevel} → ${newGuild.verificationLevel}`);
      }
      if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
        changes.push(`AFK channel: ${oldGuild.afkChannelId ? `<#${oldGuild.afkChannelId}>` : "none"} → ${newGuild.afkChannelId ? `<#${newGuild.afkChannelId}>` : "none"}`);
      }
      if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
        changes.push(`System channel: ${oldGuild.systemChannelId ? `<#${oldGuild.systemChannelId}>` : "none"} → ${newGuild.systemChannelId ? `<#${newGuild.systemChannelId}>` : "none"}`);
      }
      return {
        guild: newGuild,
        embed: embed.setColor(Colors.Yellow).setTitle("Server updated")
            .setDescription(changes.join("\n") || "Other settings changed"),
      };
    }

    case "inviteCreate": {
      const { invite } = event;
      const guild = resolveInviteGuild(invite);
      if (!guild) return null;
      embed.setColor(Colors.Green).setTitle("Invite created")
          .setDescription(`\`${invite.code}\``)
          .addFields(
              { name: "Created by", value: invite.inviter ? `${invite.inviter} (${invite.inviter.tag})` : "Unknown", inline: true },
              { name: "Channel", value: invite.channel ? `${invite.channel}` : "Unknown", inline: true },
              { name: "Max uses", value: invite.maxUses ? String(invite.maxUses) : "Unlimited", inline: true },
              { name: "Expires", value: invite.expiresTimestamp ? ts(invite.expiresTimestamp) : "Never", inline: true },
          );
      return { guild, embed };
    }

    case "inviteDelete": {
      const { invite } = event;
      const guild = resolveInviteGuild(invite);
      if (!guild) return null;
      embed.setColor(Colors.Red).setTitle("Invite deleted")
          .setDescription(`\`${invite.code}\``);
      if (invite.channel) embed.addFields({ name: "Channel", value: `${invite.channel}` });
      return { guild, embed };
    }

    case "roleCreate":
      return {
        guild: event.role.guild,
        embed: embed.setColor(Colors.Green).setTitle("Role created")
            .setDescription(`${event.role} (\`${event.role.name}\`)`),
      };

    case "roleDelete":
      return {
        guild: event.role.guild,
        embed: embed.setColor(Colors.Red).setTitle("Role deleted")
            .setDescription(`\`${event.role.name}\``),
      };

    case "roleUpdate": {
      const { oldRole, newRole } = event;
      const changes: string[] = [];
      if (oldRole.name !== newRole.name) {
        changes.push(`Name: \`${oldRole.name}\` → \`${newRole.name}\``);
      }
      if (oldRole.hexColor !== newRole.hexColor) {
        changes.push(`Color: \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``);
      }
      if (oldRole.hoist !== newRole.hoist) {
        changes.push(`Displayed separately: ${oldRole.hoist} → ${newRole.hoist}`);
      }
      if (oldRole.mentionable !== newRole.mentionable) {
        changes.push(`Mentionable: ${oldRole.mentionable} → ${newRole.mentionable}`);
      }
      if (!oldRole.permissions.equals(newRole.permissions)) {
        const granted = oldRole.permissions.missing(newRole.permissions);
        const revoked = newRole.permissions.missing(oldRole.permissions);
        if (granted.length) changes.push(`Permissions granted: ${granted.join(", ")}`);
        if (revoked.length) changes.push(`Permissions revoked: ${revoked.join(", ")}`);
      }
      if (!changes.length) return null;
      return {
        guild: newRole.guild,
        embed: embed.setColor(Colors.Yellow).setTitle("Role updated")
            .setDescription(`${newRole}\n${changes.join("\n")}`),
      };
    }
  }
}

export async function log(event: LogEvent) {
  const built = buildEmbed(event);
  if (!built) return;
  const { guild, embed } = built;

  const channelId = getLogChannel(guild.id);
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId);
  if (!channel?.isTextBased()) return;

  await channel.send({ embeds: [embed] });
}