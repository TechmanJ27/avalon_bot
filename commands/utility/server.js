const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('server').setDescription('Provides information about the server.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		const serverEmbed = new EmbedBuilder()
			.setColor(0x12a5b0)
			.setTitle(interaction.guild.name)
			.setThumbnail(interaction.guild.iconURL())
			.addFields(
				{ name:`Who We Are`, value:`Avalon is a gaming group, designed to be a chill hang-out spot where people can chat and play games together.`, inline: false },
				{ name: `Server Statistics`, value: `${interaction.guild.name} was created on <t:${Math.floor(interaction.guild.createdTimestamp/1000)}:R>, and currently has ${interaction.guild.memberCount} members.`, inline: true }
			)

		await interaction.reply(
			{ embeds: [serverEmbed] },
		);

	},
};