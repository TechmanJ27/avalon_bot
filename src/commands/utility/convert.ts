import {ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("convert")
        .setDescription("Measurement conversions")
        .addSubcommandGroup((group) =>
            group
                .setName('temperature')
                .setDescription('Temperature Conversion')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('celsius-to-fahrenheit')
                        .setDescription('Convert Celsius to Fahrenheit')
                        .addIntegerOption((option) =>
                            option
                                .setName('celsius')
                                .setDescription('Temperature in Celsius')
                                .setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('fahrenheit-to-celsius')
                        .setDescription('Convert Fahrenheit to Celsius')
                        .addIntegerOption((option) =>
                            option
                                .setName('fahrenheit')
                                .setDescription('Temperature in Fahrenheit')
                                .setRequired(true)
                        )
                )
        ).addSubcommandGroup((group) =>
            group
                .setName('weight')
                .setDescription('Weight conversion')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('lbs-to-kgs')
                        .setDescription('Convert lbs to kgs')
                        .addIntegerOption((option) =>
                            option
                                .setName('lbs')
                                .setDescription('Weight in lbs')
                                .setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('kgs-to-lbs')
                        .setDescription('Convert kgs to lbs')
                        .addIntegerOption((option) =>
                            option
                                .setName('kgs')
                                .setDescription('Weight in kgs')
                                .setRequired(true)
                        )
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral});
        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        switch (group) {

            case 'temperature':
                switch (subcommand) {
                    case 'celsius-to-fahrenheit':
                        const ctemp = interaction.options.getInteger('celsius');
                        if (!ctemp) return;
                        let fahrenheit = (ctemp * 1.8) + 32;
                        return await interaction.editReply(`${ctemp} degrees Celsius is ${fahrenheit} degrees Fahrenheit`);
                    case 'fahrenheit-to-celsius':
                        const ftemp = interaction.options.getInteger('celsius');
                        if (!ftemp) return;
                        let celsius = (ftemp * 1.8) + 32;
                        return await interaction.editReply(`${ftemp} degrees Celsius is ${celsius} degrees Fahrenheit`);
                }
                break;

            case 'weight':
                switch (subcommand) {
                    case 'lbs-to-kgs':
                        const lbs = interaction.options.getInteger('lbs');
                        if (!lbs) return;
                        let kg = lbs * 0.45;
                        return await interaction.editReply(`${lbs}lbs is equivalent to ${kg}kgs`);
                    case 'kgs-to-lbs':
                        const kgs = interaction.options.getInteger('kgs');
                        if (!kgs) return;
                        let lb = kgs / 0.45;
                        return await interaction.editReply(`${kgs}kg is equivalent to ${lb}lbs`);
                }
                break;
        }
    }
}