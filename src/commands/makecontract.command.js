const { SlashCommandBuilder } = require('@discordjs/builders');
const Contract = require('../models/contract.model.js');

const choices = [
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
        .setName('makecontract')
        .setDescription('Make a number of contracts')
        .addStringOption(option =>
            option
                .setName('resources')
                .setDescription('Type of resources')
                .setRequired(true)
                .addChoices(...choices))
        .addNumberOption(option =>
            option
                .setName('singleprice')
                .setDescription('Price of one unit of resources')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('contractsize')
                .setDescription('Number of resources sold per contract')
                .setRequired(true)),

    async execute(interaction, player) {
        // Calculate current contract id
        const prevContractId = (await Contract.findOne().sort({ contractId: -1 }).limit(1))?.contractId;
        const nextContractId = parseInt(prevContractId ?? 0) + 1;

        const contractSize = interaction.options.getInteger('contractsize');
        const resourceType = interaction.options.getString('resources');
        const price = interaction.options.getNumber('singleprice');

        // Check if player has enough resources
        if (player[resourceType] < contractSize) {
            await interaction.reply({ content: `You do not have enough ${resourceType} (You have ${Math.round(player[resourceType])})`, ephemeral: true });
            return;
        }

        player[resourceType] -= contractSize;
        player.save();

        // Post Contract
        Contract.create({
            contractId: nextContractId,
            userId: interaction.user.id,
            price,
            resourceType,
            contractSize
        });

        await interaction.reply(`Contract (#${nextContractId}) posted: ${contractSize} ${resourceType} for sale at $${price} each`);
    },
};
