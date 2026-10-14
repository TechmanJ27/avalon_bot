import { Colors, EmbedBuilder, type Guild, type GuildBan, type NonThreadGuildBasedChannel } from "discord.js";
import { getLogChannel } from "./database.js";

export type LogEvent =
  | { type: "channelCreate"; channel: NonThreadGuildBasedChannel }
  | { type: "channelDelete"; channel: NonThreadGuildBasedChannel }
  | { type: "channelUpdate"; oldChannel: NonThreadGuildBasedChannel; newChannel: NonThreadGuildBasedChannel }
  | { type: "ban"; ban: GuildBan }
  | { type: "unban"; ban: GuildBan };

function buildEmbed(event: LogEvent): { guild: Guild; embed: EmbedBuilder } {
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
  }
}

export async function log(event: LogEvent) {
  const { guild, embed } = buildEmbed(event);

  const channelId = getLogChannel(guild.id);
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId);
  if (!channel?.isTextBased()) return;

  await channel.send({ embeds: [embed] });
}