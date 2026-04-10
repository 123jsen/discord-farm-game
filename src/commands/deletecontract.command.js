const { SlashCommandBuilder } = require('discord.js');
const Contract = require('../models/contract.model.js');
const tradeService = require('../services/trade.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletecontract')
        .setDescription('Delete your contract')
        .addNumberOption(option =>
            option.setName('contractnumber').setDescription('ID of the contract, use `/list` to findout more').setRequired(true)),

    async execute(interaction, player) {
        const contractId = interaction.options.getNumber('contractnumber');
        const userId = interaction.user.id;

        const result = await tradeService.deleteContract(player, userId, contractId, Contract);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply({ content: result.message, ephemeral: true });
    },
};
