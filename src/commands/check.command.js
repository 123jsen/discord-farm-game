const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const cropList = require('../../data/crops/export.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('Check the progress of crops')
        .addIntegerOption(option =>
            option
                .setName('row')
                .setDescription('Check crop at row.')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('col')
                .setDescription('Check crop at column.')
                .setRequired(true)),

    async execute(interaction) {
        const row = interaction.options.getInteger('row') - 1;
        const col = interaction.options.getInteger('col') - 1;

        const userId = interaction.user.id;
        const player = await Player.findOne({ userId }).exec();
        const farm = player.farm;

        if (row >= player.farmHeight || col >= player.farmWidth) {
            await interaction.reply({ content: 'Coordinates are out of bound', ephemeral: true });
            return;
        }

        const index = row * player.farmWidth + col;
        const crop = cropList.find(crop => crop.name === farm[index].name);

        // Check if field is empty
        if (farm[index].name === 'Empty') {
            await interaction.reply({ content: 'No crop is planted at that spot', ephemeral: true });
            return;
        }

        // Calculate time remaining
        const timeRemaining = ((farm[index].timer.getTime() + crop.growthTime) - Date.now()) / 1000;

        if (timeRemaining < 0) {
            await interaction.reply({ content: 'Crop is ready for harvest', ephemeral: true });
        }
        else {
            if (timeRemaining > 60) {
                const mins = Math.floor(timeRemaining / 60);
                const secs = Math.round(timeRemaining - mins * 60);
                await interaction.reply({ content: `${farm[index].name} will be mature in ${mins} minutes and ${secs} seconds`, ephemeral: true });
            } else
                await interaction.reply({ content: `${farm[index].name} will be mature in ${Math.round(timeRemaining)} seconds`, ephemeral: true });
        }
    },
};
