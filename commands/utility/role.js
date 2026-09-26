const { SlashCommandBuilder, Colors, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('A handy collection of role-based utilities')
        .addSubcommand(subcommand => {
            subcommand
                .setName('ping')
                .setDescription('Pings a role')
                .addRoleOption(option => {
                    option
                        .setName('role')
                        .setDescription('The role to ping')
                        .setRequired(true)
                    return option;
                })
            return subcommand;
        })
        .addSubcommand(subcommand => {
            subcommand
                .setName('create')
                .setDescription('Create role')
                .addStringOption((option) => {
                    option
                        .setName('name')
                        .setDescription('The name of the role')
                        .setRequired(true)
                    return option;
                })
            return subcommand;
        })
        .addSubcommand(subcommand => {
            subcommand
                .setName('assign')
                .setDescription('Assign a user a role')
                .addRoleOption((option) => {
                    option
                        .setName('role')
                        .setDescription('The role to assign')
                        .setRequired(true)
                    return option;
                })
                .addUserOption((option) => {
                    option
                        .setName('user')
                        .setDescription('The user to assign the role to')
                        .setRequired(true)
                    return option;
                })
            return subcommand;
        }),

    async execute(interaction) {
        await interaction.deferReply( { flags: MessageFlags.Ephemeral } );
        const userId = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();

        if ( userId === '1049795757978435625' ) {
            switch (subcommand) {

                case 'ping':
                    await interaction.channel.send(`${interaction.options.getRole('role')}`);
                    await interaction.editReply( { content: 'Role pinged', } );
                    return;
                case 'create':
                    const name = interaction.options.getString('name')
                    await interaction.guild.roles.create({
                        name: name,
                        colors: {
                            primaryColor: Colors.Blue,
                        },
                    })
                        .then(async () => {
                            await interaction.editReply( { content: `Role ${name} created` } );
                                console.log(`Successfully created ${interaction.options.getString('name')}`);
                        })
                        .catch(console.error);
                    return;
                case 'assign':
                    const member = interaction.options.getMember('user');
                    const role = interaction.options.getRole('role');
                    await member.roles.add(role)
                        .then(async () => {
                            await interaction.editReply( { content: `Role ${role.name} assigned to ${interaction.options.getUser('user')}` } );
                            console.log(`Successfully added ${role.name} to ${member.displayName}`);
                        })
                        .catch(console.error);
                    return;
            }

        } else {
            await interaction.editReply( { content: 'You do not have the required permissions to use this command' } );
        }

    },
};