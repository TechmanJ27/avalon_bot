import {
    WebhookClient,
    ContainerBuilder,
    MessageFlags,
    ModalBuilder,
    LabelBuilder,
    TextInputBuilder,
    TextInputStyle,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    TextChannel
} from 'discord.js';
import config from '../../../config.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';

const { webhookId, webhookToken } = config;

export default {
    data: new SlashCommandBuilder()
        .setName('rule-update')
        .setDescription('(ADMIN) Update the server rules.')
        .addNumberOption((option) =>
            option
                .setName('rule')
                .setDescription('The rule to update')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        const rulesPath = path.join(__dirname, '../../data/rules.json');
        const rulesJson = fs.readFileSync(rulesPath, 'utf8');
        const rulesObject = JSON.parse(rulesJson);

        const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken });

        const ruleNum = interaction.options.getNumber('rule', true);
        const formattedRuleNum = `Rule_${ruleNum}`;

        if (!rulesObject.Rules[formattedRuleNum]) {
            return interaction.reply({
                content: `Rule ${ruleNum} does not exist.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const rulesModal = new ModalBuilder().setCustomId('rule-modal').setTitle('Rule Modal');

        const ruleInput = new TextInputBuilder()
            .setCustomId('rule-input')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('The updated rule text');

        const newRuleLabel = new LabelBuilder()
            .setLabel('What should the new rule text say?')
            .setDescription(`Current rule: ${rulesObject.Rules[formattedRuleNum]}`)
            .setTextInputComponent(ruleInput);

        rulesModal.addLabelComponents(newRuleLabel);

        await interaction.showModal(rulesModal);

        const filter = (i: any) => i.customId === 'rule-modal' && i.user.id === interaction.user.id;

        try {
            const modalSubmit = await interaction.awaitModalSubmit({ time: 60_000, filter });
            rulesObject.Rules[formattedRuleNum] = modalSubmit.fields.getTextInputValue('rule-input');

            const rulesContainer = new ContainerBuilder()
                .setAccentColor(0x12a5b0)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent('# Avalon Server Rules')
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Rule I\n${rulesObject.Rules.Rule_1}`)
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Rule II\n${rulesObject.Rules.Rule_2}`)
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Rule III\n${rulesObject.Rules.Rule_3}`)
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Rule IV\n${rulesObject.Rules.Rule_4}`)
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Rule V\n${rulesObject.Rules.Rule_5}`)
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Rule VI\n${rulesObject.Rules.Rule_6}`)
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Rule VII\n${rulesObject.Rules.Rule_7}`)
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Rule VIII\n${rulesObject.Rules.Rule_8}`)
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Rule IX\n${rulesObject.Rules.Rule_9}`)
                );

            const punishContainer = new ContainerBuilder()
                .setAccentColor(0x12a5b0)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`## Punishments\n${rulesObject.Punishments.Text}`)
                );

            const currentTime = new Date();

            const updatedContainer = new ContainerBuilder()
                .setAccentColor(0x12a5b0)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(`-# Last updated: ${currentTime.toLocaleString()}`)
                );

            try {
                const channel = await interaction.client.channels.fetch('1528927417995890729') as TextChannel;
                if (channel && rulesObject.Message_Id) {
                    await channel.messages.delete(rulesObject.Message_Id).catch(console.error);
                }
            } catch (fetchErr) {
                console.error('Failed to fetch channel or delete previous message:', fetchErr);
            }

            // Send new rule webhook message
            const newRules = await webhookClient.send({
                components: [rulesContainer, punishContainer, updatedContainer],
                flags: MessageFlags.IsComponentsV2,
                withComponents: true
            });

            rulesObject.Message_Id = newRules.id;
            const updatedJson = JSON.stringify(rulesObject, null, 2);
            fs.writeFileSync(rulesPath, updatedJson);

            await modalSubmit.reply({ content: 'Rule updated successfully.', flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.error('Modal submission timed out or failed:', err);
        }
    }
};