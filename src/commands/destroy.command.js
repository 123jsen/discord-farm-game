const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const buildings = require('../../data/buildings/export.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('destroy')
        .setDescription('Destroy a building and get a 50% refund of its price')
        .addIntegerOption(option =>
            option
                .setName('row')
                .setDescription('Destroy building at row.')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('col')
                .setDescription('Destroy building at column.')
                .setRequired(true)),

    async execute(interaction, player) {
        const row = interaction.options.getInteger('row') - 1;
        const col = interaction.options.getInteger('col') - 1;

        const index = row * player.buildingWidth + col;

        // Check if out of bound
        if (col >= player.buildingWidth || index >= player.buildingSlots) {
            await interaction.reply({ content: 'Coordinates are out of bound', ephemeral: true });
            return;
        }

        const buildingName = player.building[index].name;

        // Check if land is empty
        if (buildingName === 'Empty') {
            await interaction.reply({ content: 'Building is empty', ephemeral: true });
            return;
        }

        const category = buildings.find(build => (build.name === buildingName));
        const buildingStats = category.levels[player.building[index].level - 1];

        player.money += buildingStats.cost[0] * 0.5;
        player.wood += buildingStats.cost[1] * 0.5;
        player.stone += buildingStats.cost[2] * 0.5;
        player.metal += buildingStats.cost[3] * 0.5;

        player.building[index] = {
            name: 'Empty',
            level: 0
        }

        // Update Player Production Capacities
        Player.calculateBuildingsEffect(player);

        player.save();

        await interaction.reply(`${buildingName} is destroyed`);
    },
};
