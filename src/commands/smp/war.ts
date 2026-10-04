import {Message, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionsBitField, MessageFlags} from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('war')
        .setDescription("Declare, view, and end wars.")
        .addSubcommand(subcommand => {
            subcommand
                .setName('declare')
                .setDescription('Declare war')
            return subcommand;
        })
        .addSubcommand(subcommand => {
            subcommand
                .setName('approve')
                .setDescription('Approve a war request')
                .addStringOption(option => {
                    option
                        .setName('id')
                        .setDescription('The id of the request to approve')
                        .setRequired(true)
                    return option;
                });
            return subcommand;
        })
        .addSubcommand(subcommand => {
            subcommand
                .setName('deny')
                .setDescription('Deny a war request')
                .addStringOption(option => {
                    option
                        .setName('id')
                        .setDescription('The id of the request to deny')
                        .setRequired(true)
                    return option;
                })
                .addStringOption(option => {
                    option
                        .setName('reason')
                        .setDescription('The reason to deny the request')
                    return option;
                })
            return subcommand;
        }),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: 'This command can only be used in a server.' });
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        const myDB = interaction.client.mongo.db("avalon");
        const myColl = myDB.collection("wars");
        const coll = myDB.collection("teams");

        const REQUIRED_ROLE_ID = '1549243866517995520';
        const adminChannel = await interaction.client.channels.fetch('1549162267470463046');
        if (!adminChannel || !adminChannel.isTextBased() || !('send' in adminChannel)) return;

        switch (subcommand) {
            case 'declare':
                const channel = await interaction.guild.channels.create({
                    name: `💥｜war-declaration`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel]},
                        {id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel]},
                        {id: interaction.applicationId, allow: [PermissionsBitField.Flags.ViewChannel]},
                        {id: '1549243866517995520', allow: [PermissionsBitField.Flags.ViewChannel]},
                    ],
                });

                await interaction.reply({content: `Declaration of War request starting in <#${channel.id}>`, flags: MessageFlags.Ephemeral});

                const baseEmbed = new EmbedBuilder()
                    .setColor(0x12a5b0)
                    .setTitle('Declaration of War')
                    .setDescription('Declaration of War request started.\n\nWhat team is declaring war?');

                const processMessage = await channel.send({content: `||<@${interaction.user.id}>||`, embeds: [baseEmbed]});
                const filter = (msg: Message) => msg.author.id === interaction.user.id;

                const askQuestion = async (promptDescription: string) => {
                    const updatedEmbed = EmbedBuilder.from(processMessage.embeds[0]).setDescription(promptDescription);
                    await processMessage.edit({embeds: [updatedEmbed]});

                    const collected = await channel.awaitMessages({filter, max: 1, time: 60000, errors: ['time']});
                    const userMsg = collected.first();
                    const content = userMsg!.content;
                    await userMsg!.delete().catch(() => {
                    });
                    return content;
                };

                try {
                    let attackingTeam = '';
                    while (await coll.findOne({name: attackingTeam.toLowerCase()}) === null) {
                        attackingTeam = await askQuestion(`What team are you declaring war on behalf of?`);
                        if (await coll.findOne({name: attackingTeam.toLowerCase()}) === null) {
                            const errorMsg = await channel.send(`${attackingTeam} is not a registered team. Please try again.`);
                            attackingTeam = '';
                            setTimeout(() => errorMsg.delete().catch(() => {
                            }), 3000);
                        } else {
                            const docs = await coll.findOne({name: attackingTeam.toLowerCase()});
                            if (!docs) return;
                            if (docs.owner !== interaction.user.id) {
                                const errorMsg = await channel.send(`You are not the owner of ${attackingTeam}.`);
                                attackingTeam = '';
                                setTimeout(() => errorMsg.delete().catch(() => {
                                }), 3000);
                            }
                        }
                    }

                    let defendingTeam = '';
                    while (await coll.findOne({name: defendingTeam.toLowerCase()}) === null || defendingTeam.toLowerCase() === attackingTeam.toLowerCase()) {
                        defendingTeam = await askQuestion(`What team are you declaring war on?`);
                        if (await coll.findOne({name: defendingTeam.toLowerCase()}) === null) {
                            const errorMsg = await channel.send(`${defendingTeam} is not a registered team. Please try again.`);
                            defendingTeam = '';
                            setTimeout(() => errorMsg.delete().catch(() => {
                            }), 3000);
                        }
                        if (defendingTeam.toLowerCase() === attackingTeam.toLowerCase()) {
                            const errorMsg = await channel.send(`You cannot declare war on yourself.`);
                            defendingTeam = '';
                            setTimeout(() => errorMsg.delete().catch(() => {
                            }), 3000);
                        }
                    }

                    const reason = await askQuestion(`For what reason are you declaring war?`);

                    const plan = await askQuestion(`Do you plan to only attack military targets or directly attack civilians?`);

                    const confirmation = await askQuestion(`Type **Y** to confirm and finalize a declaration of war on behalf of ${attackingTeam} against ${defendingTeam}.`);

                    if (['yes', 'y'].includes(confirmation.toLowerCase())) {

                        const warId = Math.random().toString(36).substring(2);

                        await myColl.insertOne({
                            user: interaction.user.id,
                            customId: warId,
                            attackingTeam: attackingTeam,
                            defendingTeam: defendingTeam,
                            reason: reason,
                            plan: plan,
                            status: 'Awaiting approval',
                            requestedAt: new Date()
                        });

                        const finalEmbed = EmbedBuilder.from(processMessage.embeds[0])
                            .setDescription(`💥 **Declaration Request Sent**`);

                        await processMessage.edit({embeds: [finalEmbed]});

                        const adminEmbed = new EmbedBuilder()
                            .setColor(0x12a5b0)
                            .setTitle('Declaration of War - Awaiting Approval')
                            .addFields(
                                {name: 'Summary', value: `${attackingTeam} is declaring war on ${defendingTeam}`},
                                {name: 'Reason', value: `${reason}`},
                                {name: 'Details', value: `${plan}`},
                                {name: '\u200b', value: `Run /war approve id:${warId} to approve`},
                            );

                        const approveMessage = await adminChannel.send({embeds: [adminEmbed]});

                        const approveFilter = { customId: warId };

                        const updateDocument = {
                            $set: {
                                approveMsgId: approveMessage.id,
                            },
                        };
                        const result = await myColl.updateOne(approveFilter, updateDocument);
                        console.log(result);

                        setTimeout(() => channel.delete().catch(() => {
                        }), 10000);
                        return;
                    } else {
                        await channel.send('Declaration of War cancelled.');
                        setTimeout(() => channel.delete().catch(() => {
                        }), 5000);
                    }

                } catch (err) {
                    await channel.send('Declaration of War timed out or an error occurred. This channel will close shortly.');
                    setTimeout(() => channel.delete().catch(() => {
                    }), 5000);
                }
                return;
            case 'approve':
                await interaction.deferReply();
                if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
                    return await interaction.editReply('You do not have the required role to use this command.',);
                }

                const approveFilter = { customId: interaction.options.getString('id') };
                const doc = await myColl.findOne(approveFilter)

                if (!doc) {
                    await interaction.editReply('Id is invalid');
                    return;
                }
                const warChannel = await interaction.client.channels.fetch('1549504858200215652');
                if (!warChannel || !warChannel.isTextBased() || !('send' in warChannel)) return;

                const message = await adminChannel.messages.fetch(doc.approveMsgId);

                if (doc.status !== 'Awaiting approval') {
                    return await interaction.editReply({
                        content: 'This request has already been approved.'
                    });
                }

                const approveEmbed = new EmbedBuilder()
                    .setColor(0x12a5b0)
                    .setTitle('Declaration of War - Approved')
                    .addFields(
                        {name: 'Summary', value: `${doc.attackingTeam} is declaring war on ${doc.defendingTeam}`},
                        {name: 'Reason', value: `${doc.reason}`},
                        {name: 'Details', value: `${doc.plan}`},
                    );

                await message.edit( { embeds: [approveEmbed] } );

                const updateDocument = {
                    $set: {
                        status: `Approved`,
                        approvedBy: interaction.user.id,
                        approvedAt: new Date()
                    },
                };

                await myColl.updateOne(approveFilter, updateDocument);

                await interaction.editReply( { content: 'War approved' } );

                try {
                    const user = await interaction.client.users.fetch(doc.user);
                    await user.send(`Your war request on ${doc.defendingTeam} has been approved`);
                } catch (error) {
                    console.error('Could not send DM:', error);
                }

                const warAnnounceEmbed = new EmbedBuilder()
                    .setColor(0x12a5b0)
                    .setTitle('War declared!')
                    .setDescription(`${doc.attackingTeam} has declared war on ${doc.defendingTeam}!`);

                await warChannel.send( { embeds: [warAnnounceEmbed] } );
                return;

            case 'deny':
                await interaction.deferReply();
                if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
                    return await interaction.editReply('You do not have permission to run this command.',);
                }

                const denyFilter = { customId: interaction.options.getString('id') };
                const denyDoc = await myColl.findOne(denyFilter)

                if (!denyDoc) {
                    await interaction.editReply('Id is invalid');
                    return;
                }

                const denyMessage = await adminChannel.messages.fetch(denyDoc.approveMsgId);

                if (denyDoc.status !== 'Awaiting approval') {
                    return await interaction.editReply({
                        content: 'This request has already been approved.'
                    });
                }

                const denyEmbed = new EmbedBuilder()
                    .setColor(0x12a5b0)
                    .setTitle('Declaration of War - Denied')
                    .addFields(
                        {name: 'Summary', value: `${denyDoc.attackingTeam} is declaring war on ${denyDoc.defendingTeam}`},
                        {name: 'Reason', value: `${denyDoc.reason}`},
                        {name: 'Details', value: `${denyDoc.plan}`},
                    );

                await denyMessage.edit( { embeds: [denyEmbed] } );

                try {
                    const user = await interaction.client.users.fetch(denyDoc.user);
                    await user.send(`Your war request on ${denyDoc.defendingTeam} has been denied`);
                } catch (error) {
                    console.error('Could not send DM:', error);
                }

                await myColl.deleteOne(denyFilter);
                await interaction.editReply( { content: 'War denied' } );

                return;
        }
    },
};

