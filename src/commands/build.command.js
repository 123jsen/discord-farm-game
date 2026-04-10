const { SlashCommandBuilder } = require('discord.js');
const Player = require('../models/player.model.js');
const buildings = require('../../data/buildings/export.js');
const buildService = require('../services/build.service.js');

const choices = [];
buildings.forEach(build => {
    if (build.name !== 'Empty')
        choices.push({ name: `${build.image} ${build.name}`, value: build.target });
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName('build')
        .setDescription('Build a new building')
        .addIntegerOption(option =>
            option.setName('row').setDescription('Build building at row.').setRequired(true))
        .addIntegerOption(option =>
            option.setName('col').setDescription('Build building at column.').setRequired(true))
        .addStringOption(option =>
            option.setName('type').setDescription('Building type').setRequired(true)
                .addChoices(...choices)),

    async execute(interaction, player) {
        const row = interaction.options.getInteger('row') - 1;
        const col = interaction.options.getInteger('col') - 1;
        const buildTarget = interaction.options.getString('type');

        const result = await buildService.build(player, row, col, buildTarget, buildings, Player);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
