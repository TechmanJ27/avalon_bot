import {ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder} from "discord.js";


export default {
    data: new SlashCommandBuilder()
        .setName("dev")
        .setDescription("Dev overrides")
        .addSubcommandGroup((group) =>
            group
                .setName('war')
                .setDescription('War overrides')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('start')
                        .setDescription('Forcefully start a war')
                        .addStringOption((option) =>
                            option
                                .setName('attacking')
                                .setDescription('The attacking team')
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName('defending')
                                .setDescription('The defending team')
                                .setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('end')
                        .setDescription('Forcefully end a war')
                        .addStringOption((option) =>
                            option
                                .setName('id')
                                .setDescription('The war id')
                                .setRequired(true)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('get')
                        .setDescription('Get a war based on a query')
                        .addStringOption((option) =>
                            option
                                .setName('default')
                                .setDescription('Default for production')
                        )
                )
        )
        .addSubcommandGroup((group) =>
            group
                .setName('team')
                .setDescription('Team overrides')
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('add')
                        .setDescription('Add a user to a team')
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('kick')
                        .setDescription('Kick a user from a team')
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const dev = '1049795757978435625';
        if (interaction.user.id != dev) return await interaction.editReply('Only the bot dev can run this command!');

        const db = interaction.client.mongo.db("avalon");
        const warColl = db.collection("wars");
        const teamColl = db.collection("teams");

        const group = interaction.options.getSubcommandGroup();
        if (!group) return;
        const subcommand = interaction.options.getSubcommand();

        switch (group) {

            case 'war':
                switch (subcommand) {

                    case 'start':
                        const attacking = interaction.options.getString("attacking");
                        const defending = interaction.options.getString("defending");

                        if (await teamColl.findOne({name: attacking?.toLowerCase()}) === null) return await interaction.editReply(`Team with name ${attacking} not found.`);
                        if (await teamColl.findOne({name: defending?.toLowerCase()}) === null) return await interaction.editReply(`Team with name ${defending} not found.`);

                        if (attacking === defending) return await interaction.editReply('A team cannot declare war on itself!');

                        await warColl.insertOne({
                            user: interaction.user.id,
                            customId: Math.random().toString(36).substring(2),
                            attackingTeam: attacking,
                            defendingTeam: defending,
                            status: 'Approved',
                            approvedBy: interaction.user.id,
                            approvedAt: new Date(),
                            requestedAt: new Date(),
                            dev: true
                        });

                        await interaction.editReply(`War started between team with id ${attacking} and team with id ${defending}`);
                        break;

                    case 'end':
                        const warId = interaction.options.getString("id");

                        if (!warId) return await interaction.editReply(`War with id ${warId} not found.`);

                        const deleteFilter = { customId: warId };
                        await warColl.updateOne(deleteFilter, {
                            $set: {
                                status: 'Ended',
                                dev: true,
                                endedAt: new Date(),
                                endedBy: dev
                            }
                        });

                        await interaction.editReply(`War with id ${warId} was ended`);
                        break;

                    case 'get':

                        break;

                }
                break;

            case 'team':
                switch (subcommand) {

                    case 'add':

                    case 'kick':

                }
        }
    }
}