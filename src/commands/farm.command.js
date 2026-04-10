const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const crops = require('../../data/crops/export.js');
const buildings = require('../../data/buildings/export.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('farm')
        .setDescription('Shows current farm plot'),
    async execute(interaction, player) {
        let resourceStr = '';
        resourceStr = resourceStr.concat(`🪵 ${Math.round(player.wood)} (+ ${Math.round(player.woodCapacity)}/hr)\n`);
        resourceStr = resourceStr.concat(`🪨 ${Math.round(player.stone)} (+ ${Math.round(player.stoneCapacity)}/hr)\n`);
        resourceStr = resourceStr.concat(`🔧 ${Math.round(player.metal)} (+ ${Math.round(player.metalCapacity)}/hr)\n`);

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

        const prestigeCount = player.prestigeCount || 0;
        const prestigeValue = prestigeCount > 0
            ? `${'💎'.repeat(Math.min(prestigeCount, 5))} Level ${prestigeCount} (×${Math.pow(1.15, prestigeCount).toFixed(2)} income)`
            : 'None';

        const farmEmbed = new EmbedBuilder()
            .setColor('#a84232')
            .setTitle(player.farmName)
            .addFields(
                { name: 'Prestige', value: prestigeValue },
                { name: 'Money', value: `$${Math.round(player.money * 100) / 100}` },
                { name: 'Resouces', value: resourceStr},
                { name: 'Farm', value: farmStr },
                { name: 'Buildings', value: buildStr }
            )
        await interaction.reply({ embeds: [farmEmbed] });
    },
};
