const { SlashCommandBuilder } = require('discord.js');
const prestigeService = require('../services/prestige.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prestige')
        .setDescription('Initiate a server-wide prestige race to reset your farm for a permanent income multiplier'),

    async execute(interaction, player, server) {
        const result = await prestigeService.initiateRace(player, server);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
