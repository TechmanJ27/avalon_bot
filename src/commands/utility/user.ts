import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	async execute(interaction: ChatInputCommandInteraction) {
		const avatar = interaction.user.displayAvatarURL();

		let joinedTimestampText = 'N/A';
		if (interaction.member instanceof GuildMember && interaction.member.joinedTimestamp) {
			joinedTimestampText = `<t:${Math.floor(interaction.member.joinedTimestamp / 1000)}:R>`;
		}

		const userEmbed = new EmbedBuilder()
			.setColor(0x12a5b0)
			.setTitle(`${interaction.user.username}`)
			.setThumbnail(avatar)
			.addFields(
				{
					name: `User Statistics`,
					value: `This command was run by ${interaction.user.username}, who joined on ${joinedTimestampText}`,
					inline: true
				}
			);

		await interaction.reply({ embeds: [userEmbed] });
	},
};