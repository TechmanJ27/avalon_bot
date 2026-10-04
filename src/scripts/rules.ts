import { WebhookClient, ContainerBuilder, MessageFlags, SeparatorSpacingSize } from 'discord.js';
import config from '../../config.json' with { type: 'json' };

const { webhookId, webhookToken } = config;

const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken });

const rulesContainer = new ContainerBuilder()
.setAccentColor(0x12a5b0)
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'# Avalon Server Rules',
	),
)
.addSeparatorComponents((separator) => separator
  .setDivider(true)
  .setSpacing(SeparatorSpacingSize.Large),
 )
.addTextDisplayComponents((textDisplay) =>
	  textDisplay.setContent(
		'## Rule I\nBe respectful to all members. Do not discriminate based on race, religion, gender, etc.',
	),
)
.addSeparatorComponents((separator) => separator
  .setDivider(true)
  .setSpacing(SeparatorSpacingSize.Large),
 )
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'## Rule II\nNO NSFW. Cadal and the community managers will determine if content is too graphic. If you\'re unsure, open a ticket.',
	),
)
.addSeparatorComponents((separator) => separator
  .setDivider(true)
  .setSpacing(SeparatorSpacingSize.Large),
 )
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'## Rule III\nDon’t harass our members. Harassment will not be tolerated.',
	),
)
.addSeparatorComponents((separator) => separator
  .setDivider(true)
  .setSpacing(SeparatorSpacingSize.Large),
   )
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'## Rule IV\nCursing is allowed, but please don’t say slurs.',
	),
)
.addSeparatorComponents((separator) => separator
  .setDivider(true)
  .setSpacing(SeparatorSpacingSize.Large),
   )
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'## Rule V\nHave common sense. If you think you shouldn’t do something, don’t do it.',
	),
)
.addSeparatorComponents((separator) => separator
  .setDivider(true)
  .setSpacing(SeparatorSpacingSize.Large),
   )
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'## Rule VI\nFollow Discord ToS.',
	),
)
.addSeparatorComponents((separator) => separator
  .setDivider(true)
  .setSpacing(SeparatorSpacingSize.Large),
   )
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'## Rule VII\nPlease refrain from discussing real-life politics.',
	),
)
.addSeparatorComponents((separator) => separator
  .setDivider(true)
  .setSpacing(SeparatorSpacingSize.Large),
   )
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'## Rule VIII\nDo not advertise other servers or anything of the sort without first getting approval from an admin.',
	),
)
.addSeparatorComponents((separator) => separator
  .setDivider(true)
  .setSpacing(SeparatorSpacingSize.Large),
   )
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'## Rule IX\nAffiliated servers will not be moderated by our staff; however, you can still get banned for anything you say there or anywhere else, including servers, group chats, and DMs.',
	),
);

  const punishContainer = new ContainerBuilder()
.setAccentColor(0x12a5b0)
.addTextDisplayComponents((textDisplay) =>
	textDisplay.setContent(
		'## Punishments\nPunishments will be determined on a case-by-case basis.\nThe severity of a punishment will be dependent on how severe a rule you broke and how many previous infractions you have.\nYour first infraction will almost always be a warning.',
	),
)

webhookClient.send({
username: 'Avalon Rules',
avatarURL: 'https://i.imgur.com/edTP3Cm.png',
components: [rulesContainer, punishContainer],
flags: MessageFlags.IsComponentsV2,
withComponents: true,
});