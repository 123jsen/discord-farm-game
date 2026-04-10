const { SlashCommandBuilder } = require('discord.js');
const cropList = require('../../data/crops/export.js');
const farmService = require('../services/farm.service.js');

const cropChoices = [];
cropList.forEach(crop => {
    if (crop.name !== 'Empty')
        cropChoices.push({
            name: `${crop.image} ${crop.name} Cost:$${crop.cost}`,
            value: crop.name
        });
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plantall')
        .setDescription('Plant crop at all fields, or until insufficient money')
        .addStringOption(option =>
            option.setName('seed').setDescription('Crop to be planted').setRequired(true)
                .addChoices(...cropChoices)),

    async execute(interaction, player) {
        const seed = interaction.options.getString('seed');

        const result = await farmService.plantAll(player, seed, cropList);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
