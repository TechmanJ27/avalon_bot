const { SlashCommandBuilder, EmbedBuilder, ChannelType} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('server').setDescription('Provides information about the server.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		const serverEmbed = new EmbedBuilder()
			.setColor(0x12a5b0)
			.setTitle(interaction.guild.name)
			.setThumbnail(interaction.guild.iconURL())
			.addFields(
				{name:`Who We Are`, value:`Avalon is a gaming group, designed to be a chill hang-out spot where people can chat and play games together.`},
				{name: '\u200b', value: `Members: ${interaction.guild.memberCount}\nRoles: ${interaction.guild.roles.cache.size}\nChannels: ${interaction.guild.channels.cache.size} total - ${interaction.guild.channels.cache.filter(c => c.isTextBased()).size} text-based - ${interaction.guild.channels.cache.filter(c => c.isVoiceBased()).size} voice - ${interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size} categories\nCreated: <t:${Math.floor(interaction.guild.createdTimestamp/1000)}:R>`}
			)

		await interaction.reply(
			{ embeds: [serverEmbed] },
		);

	},
};