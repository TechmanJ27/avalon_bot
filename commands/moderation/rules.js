// Imports
const { WebhookClient, ContainerBuilder, MessageFlags, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { webhookId, webhookToken } = require('../../config.json');
const fs = require('fs');
const path = require('path');

module.exports = {
    // Slash Command Builder
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

    async execute(interaction) {
        // Fetch rule path, json, and finally object
        const rulesPath = path.join(__dirname, '../../data/rules.json')
        const rulesJson = fs.readFileSync(rulesPath, 'utf8');
        const rulesObject = JSON.parse(rulesJson);

        const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken });

        // Get rule number and formatted version
        const ruleNum = interaction.options.getNumber('rule');
        const formattedRuleNum = `Rule_${ruleNum}`;

        // Create Modal
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

        // Send Modal to user
        await interaction.showModal(rulesModal);

        // Set filter for modal submission event
        const filter = (i) => i.customId === 'rule-modal' && i.user.id === interaction.user.id;

        try {
            // Get modal inputs upon submission and update object
            const modalSubmit = await interaction.awaitModalSubmit({ time: 60_000, filter });
            rulesObject.Rules[formattedRuleNum] = modalSubmit.fields.getTextInputValue('rule-input');

            // Create new rule container
            const rulesContainer = new ContainerBuilder()
                .setAccentColor(0x12a5b0)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        '# Avalon Server Rules',
                    ),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Rule I\n${rulesObject.Rules.Rule_1}`,
                    ),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Rule II\n${rulesObject.Rules.Rule_2}`,
                    ),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Rule III\n${rulesObject.Rules.Rule_3}`,
                    ),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Rule IV\n${rulesObject.Rules.Rule_4}`,
                    ),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Rule V\n${rulesObject.Rules.Rule_5}`,
                    ),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Rule VI\n${rulesObject.Rules.Rule_6}`,
                    ),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Rule VII\n${rulesObject.Rules.Rule_7}`,
                    ),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Rule VIII\n${rulesObject.Rules.Rule_8}`,
                    ),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Rule IX\n${rulesObject.Rules.Rule_9}`,
                    ),
                );

            // Create new punishments container
            const punishContainer = new ContainerBuilder()
                .setAccentColor(0x12a5b0)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `## Punishments\n${rulesObject.Punishments.Text}`,
                    ),
                );

            // Fetch current timestamp
            const currentTime = new Date();

            // Create a container to store the time updated
            const updatedContainer = new ContainerBuilder()
                .setAccentColor(0x12a5b0)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent(
                        `-# Last updated: ${currentTime}`,
                    ),
                );

            // Fetch and delete previous rules message
            interaction.client.channels.fetch('1528927417995890729').then(channel => {
                channel.messages.delete(rulesObject.Message_Id)
                    .then(() => console.log('Message deleted successfully'))
                    .catch(console.error);
            });

            // Send new rule webhook message
            const newRules = await webhookClient.send({
                components: [rulesContainer, punishContainer, updatedContainer],
                flags: MessageFlags.IsComponentsV2,
                withComponents: true,
                wait: true
            })

            // Update json to match new input
            rulesObject.Message_Id = newRules.id;
            const updatedJson = JSON.stringify(rulesObject, null, 2);
            fs.writeFileSync(rulesPath, updatedJson);

            // Inform user the update succeeded
            await modalSubmit.reply({ content: 'Rule updated successfully.', flags: MessageFlags.Ephemeral });
        } catch (err) {
            // Catch modal errors/timeouts and return an error instead of crashing
            console.error('Modal submission timed out or failed:', err);
        }
    }
}