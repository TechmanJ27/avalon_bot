const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('user').setDescription('Provides information about the user.'),
	async execute(interaction) {
		const avatar = interaction.user.displayAvatarURL();
		const userEmbed = new EmbedBuilder()
			.setColor(0x12a5b0)
			.setTitle(`${interaction.user.username}`)
			.setThumbnail(avatar)
			.addFields(
				{ name: `User Statistics`, value: `This command was run by ${interaction.user.username}, who joined on <t:${Math.floor(interaction.member.joinedTimestamp/1000)}:R>`, inline: true }
			)
		await interaction.reply(
			{ embeds: [userEmbed] },
		);
	},
};