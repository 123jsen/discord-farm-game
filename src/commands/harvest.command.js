const { SlashCommandBuilder } = require('discord.js');
const crops = require('../../data/crops/export.js');
const farmService = require('../services/farm.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('harvest')
        .setDescription('Harvest all mature crops'),

    async execute(interaction, player) {
        const result = await farmService.harvest(player, crops);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
