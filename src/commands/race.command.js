const { SlashCommandBuilder } = require('discord.js');
const prestigeService = require('../services/prestige.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('race')
        .setDescription('Check the current prestige race progress'),

    async execute(interaction, player, server) {
        const result = prestigeService.getRaceStatus(server);
        await interaction.reply({ content: result.message, ephemeral: true });
    },
};
