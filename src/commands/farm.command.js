const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const crops = require('../../data/crops/export.js');
const buildings = require('../../data/buildings/export.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('farm')
        .setDescription('Shows current farm plot'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await Player.findOne({ userId }).exec();

        let resourceStr = '';
        resourceStr = resourceStr.concat(`🪵 ${Math.round(player.wood)} (+ ${player.woodCapacity}/hr)\n`);
        resourceStr = resourceStr.concat(`🪨 ${Math.round(player.stone)} (+ ${player.stoneCapacity}/hr)\n`);
        resourceStr = resourceStr.concat(`🔧 ${Math.round(player.metal)} (+ ${player.metalCapacity}/hr)\n`);

        let farmStr = '';
        for (let i = 0; i < player.farmHeight; i++) {
            for (let j = 0; j < player.farmWidth; j++) {
                const index = i * player.farmWidth + j;
                const { image } = crops.find(crop => crop.name === player.farm[index].name);
                farmStr = farmStr.concat(image);
            }
            farmStr = farmStr.concat("\n");
        }

        let buildStr = '';
        for (let i = 0; i < player.buildingSlots; i++) {
            if ((i !== 0) && ((i % player.buildingWidth) === 0))
                buildStr = buildStr.concat("\n");
                
            const { image } = buildings.find(build => build.name === player.building[i].name);
            buildStr = buildStr.concat(image);
        }

        const farmEmbed = new MessageEmbed()
            .setColor('#a84232')
            .setTitle(player.farmName)
            .addFields(
                { name: 'Money', value: `$${player.money}` },
                { name: 'Resouces', value: resourceStr},
                { name: 'Farm', value: farmStr },
                { name: 'Building', value: buildStr }
            )
        await interaction.reply({ embeds: [farmEmbed] });
    },
};
