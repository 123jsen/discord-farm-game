const { SlashCommandBuilder } = require('discord.js');
const Contract = require('../models/contract.model.js');
const tradeService = require('../services/trade.service.js');

const choices = [
    { name: '🪵 Wood',  value: 'wood' },
    { name: '🪨 Stone', value: 'stone' },
    { name: '🔧 Metal', value: 'metal' }
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('makecontract')
        .setDescription('Make a number of contracts')
        .addStringOption(option =>
            option.setName('resources').setDescription('Type of resources').setRequired(true)
                .addChoices(...choices))
        .addNumberOption(option =>
            option.setName('singleprice').setDescription('Price of one unit of resources').setRequired(true))
        .addIntegerOption(option =>
            option.setName('contractsize').setDescription('Number of resources sold per contract').setRequired(true)),

    async execute(interaction, player) {
        const userId = interaction.user.id;
        const resourceType = interaction.options.getString('resources');
        const price = interaction.options.getNumber('singleprice');
        const contractSize = interaction.options.getInteger('contractsize');

        const result = await tradeService.makeContract(player, userId, resourceType, price, contractSize, Contract);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
