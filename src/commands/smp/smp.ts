import {AttachmentBuilder, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import fs from 'fs';
import path from 'path';

export default {
    data: new SlashCommandBuilder()
        .setName("smp")
        .setDescription("Info related to the SMP")
        .addSubcommand(subcommand =>
            subcommand
                .setName("ip")
                .setDescription('View the server ip')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("modpack")
                .setDescription('Download the server modpack')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("season")
                .setDescription('See info on the current season')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("rules")
                .setDescription('View the server rules')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const serverPath = path.join(import.meta.dirname, '../../data/rules.json');
        const serverJson = fs.readFileSync(serverPath, 'utf8');
        const serverInfo = JSON.parse(serverJson);
        const subcommand = interaction.options.getSubcommand();
        let embed = new EmbedBuilder().setColor(0x12a5b0);
        switch (subcommand) {
            case "ip":
                embed.setTitle('Server IP').setDescription(serverInfo.serverIP);
                await interaction.editReply({embeds: [embed]});
                break;
            case "modpack":
                embed.setTitle('Server Modpack').setDescription('The .zip file is the curseforge modpack, and the .mrpack file is the modrinth one.');
                const cfPack = new AttachmentBuilder('../.././packs/curseforge_pack.zip', { name: 'curseforge_pack' });
                const mrPack = new AttachmentBuilder('../.././packs/modrinth_pack.mrpack', { name: 'modrinth_pack' });
                await interaction.editReply({embeds: [embed], files: [cfPack, mrPack]});
                break;
            case "season":
                embed.setTitle('Season Info').noTitleField('Current Season: II').addFields({name: 'Title', value: 'Create: Money & Machines'}, {name: 'Description', value: 'Explore a vast and unique world, build farms and shops, and climb your way to the top of the net worth leaderboards!'});
                await interaction.editReply({embeds: [embed]});
                break;
            case "rules":
                embed.setTitle('SMP Rules').noTitleField('1. Griefing is banned except during wars (declared using /war declare).\n' +
                    '2. Stealing is allowed, but only from chests and containers outside of player-made structures.\n' +
                    '3. Usage of hacks and cheats (including x-ray) will result in a perma ban. This includes freecam and the use of replay mod to x-ray for bases and/or caves.\n' +
                    '4. No spawn-killing is allowed.\n' +
                    '5. NO DUPES!!!\n' +
                    '6. All server chat rules apply to the in-game chat.');
                await interaction.editReply({embeds: [embed]});
        }
    }
}