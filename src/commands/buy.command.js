const { SlashCommandBuilder } = require('discord.js');
const { GOLD_PER_RESOURCES } = require('../../data/config.json');
const tradeService = require('../services/trade.service.js');

const choices = [
    { name: '🪵 Wood',  value: 'wood' },
    { name: '🪨 Stone', value: 'stone' },
    { name: '🔧 Metal', value: 'metal' }
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy resources with gold')
        .addIntegerOption(option =>
            option.setName('amount').setDescription('Buy this amount of resources').setRequired(true))
        .addStringOption(option =>
            option.setName('resources').setDescription('Type of resources').setRequired(true)
                .addChoices(...choices)),

    async execute(interaction, player) {
        const amount = interaction.options.getInteger('amount');
        const resourceType = interaction.options.getString('resources');

        const result = await tradeService.buyResource(player, amount, resourceType);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
