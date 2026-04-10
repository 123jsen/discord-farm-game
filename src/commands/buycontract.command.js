const { SlashCommandBuilder } = require('discord.js');
const Contract = require('../models/contract.model.js');
const Player = require('../models/player.model.js');
const tradeService = require('../services/trade.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buycontract')
        .setDescription('Buy resources from a contract')
        .addNumberOption(option =>
            option.setName('contractnumber').setDescription('ID of the contract, use `/list` to findout more').setRequired(true))
        .addNumberOption(option =>
            option.setName('buyamount').setDescription('How much resources to buy').setRequired(true)),

    async execute(interaction, player) {
        const contractId = interaction.options.getNumber('contractnumber');
        const buyAmount = interaction.options.getNumber('buyamount');
        const buyerUserId = interaction.user.id;

        const result = await tradeService.buyContract(player, buyerUserId, contractId, buyAmount, Contract, Player);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
