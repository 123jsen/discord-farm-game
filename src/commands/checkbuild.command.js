const { SlashCommandBuilder } = require('discord.js');
const buildService = require('../services/build.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkbuild')
        .setDescription('Check the level of a building')
        .addIntegerOption(option =>
            option.setName('row').setDescription('Build building at row.').setRequired(true))
        .addIntegerOption(option =>
            option.setName('col').setDescription('Build building at column.').setRequired(true)),

    async execute(interaction, player) {
        const row = interaction.options.getInteger('row') - 1;
        const col = interaction.options.getInteger('col') - 1;

        const result = buildService.checkBuild(player, row, col);
        await interaction.reply({ content: result.message, ephemeral: true });
    },
};
