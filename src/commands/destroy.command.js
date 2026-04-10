const { SlashCommandBuilder } = require('discord.js');
const Player = require('../models/player.model.js');
const buildings = require('../../data/buildings/export.js');
const { REFUND_PERCENT } = require('../../data/config.json');
const buildService = require('../services/build.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('destroy')
        .setDescription(`Destroy a building and get ${REFUND_PERCENT} of its price back`)
        .addIntegerOption(option =>
            option.setName('row').setDescription('Destroy building at row.').setRequired(true))
        .addIntegerOption(option =>
            option.setName('col').setDescription('Destroy building at column.').setRequired(true)),

    async execute(interaction, player) {
        const row = interaction.options.getInteger('row') - 1;
        const col = interaction.options.getInteger('col') - 1;

        const result = await buildService.destroy(player, row, col, buildings, REFUND_PERCENT, Player);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
