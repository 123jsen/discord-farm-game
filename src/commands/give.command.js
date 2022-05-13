const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');

const choices = [
    {
        name: '🪙 Money',
        value: 'money'
    },
    {
        name: '🪵 Wood',
        value: 'wood'
    },
    {
        name: '🪨 Stone',
        value: 'stone'
    },
    {
        name: '🔧 Metal',
        value: 'metal'
    }
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Give some resources to another player')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('Use @ to mention target')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('resources')
                .setDescription('Type of resources')
                .setRequired(true)
                .addChoices(...choices))
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of resources')
                .setRequired(true)),

    async execute(interaction, player) {
        const userId = interaction.user.id;
        const targetId = interaction.options.getUser('target').id;

        if (userId === targetId) {
            await interaction.reply({ content: 'You cannot give resources to yourself', ephemeral: true });
            return;
        }
        const targetPlayer = await Player.findOne({ userId: targetId });

        if (!targetPlayer) {
            await interaction.reply({ content: 'That Player is not found', ephemeral: true });
            return;
        }

        const amount = interaction.options.getInteger('amount');
        const resourceType = interaction.options.getString('resources');
        if (player[resourceType] < amount) {
            await interaction.reply({ content: `You don\'t have enough ${resourceType}`, ephemeral: true });
            return;
        }

        player[resourceType] -= amount;
        targetPlayer[resourceType] += amount;

        player.save();
        targetPlayer.save();

        await interaction.reply(`<@${userId}> gave ${amount} ${resourceType} to <@${targetId}>`);
    },
};
