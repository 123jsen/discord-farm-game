const { SlashCommandBuilder } = require('discord.js');
const cropList = require('../../data/crops/export.js');
const farmService = require('../services/farm.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('Check the progress of crops')
        .addIntegerOption(option =>
            option.setName('row').setDescription('Check crop at row.').setRequired(true))
        .addIntegerOption(option =>
            option.setName('col').setDescription('Check crop at column.').setRequired(true)),

    async execute(interaction, player) {
        const row = interaction.options.getInteger('row') - 1;
        const col = interaction.options.getInteger('col') - 1;

        const result = farmService.checkCrop(player, row, col, cropList);
        await interaction.reply({ content: result.message, ephemeral: true });
    },
};
