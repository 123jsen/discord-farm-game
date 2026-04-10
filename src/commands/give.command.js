const { SlashCommandBuilder } = require('discord.js');
const Player = require('../models/player.model.js');
const tradeService = require('../services/trade.service.js');

const choices = [
    { name: '🪙 Money', value: 'money' },
    { name: '🪵 Wood',  value: 'wood' },
    { name: '🪨 Stone', value: 'stone' },
    { name: '🔧 Metal', value: 'metal' }
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Give some resources to another player')
        .addUserOption(option =>
            option.setName('target').setDescription('Use @ to mention target').setRequired(true))
        .addStringOption(option =>
            option.setName('resources').setDescription('Type of resources').setRequired(true)
                .addChoices(...choices))
        .addIntegerOption(option =>
            option.setName('amount').setDescription('Amount of resources').setRequired(true)),

    async execute(interaction, player) {
        const userId = interaction.user.id;
        const targetId = interaction.options.getUser('target').id;
        const targetPlayer = await Player.findOne({ userId: targetId });
        const resourceType = interaction.options.getString('resources');
        const amount = interaction.options.getInteger('amount');

        const result = await tradeService.give(player, targetPlayer, resourceType, amount, userId, targetId);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
