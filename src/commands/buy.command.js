const { SlashCommandBuilder } = require('@discordjs/builders');

const { GOLD_PER_RESOURCES } = require('../../data/config.json');

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
        .setName('buy')
        .setDescription('Buy resources with gold')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Buy this amount of resources')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('resources')
                .setDescription('Type of resources')
                .setRequired(true)
                .addChoices(...choices)),

    async execute(interaction, player) {
        const amount = interaction.options.getInteger('amount');
        const resourceType = interaction.options.getString('resources');

        if (player.money < amount * GOLD_PER_RESOURCES) {
            await interaction.reply({ content: `You don't have enough money`, ephemeral: true });
            return;
        }

        player.money -= amount * GOLD_PER_RESOURCES;
        player[resourceType] += amount;
        player.save();

        await interaction.reply(`You bought ${amount} ${resourceType} with $${amount * GOLD_PER_RESOURCES}`);
    },
};
