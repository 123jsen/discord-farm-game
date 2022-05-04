const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const Crop = require("../models/crop.model.js");

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
        const player = await Player.findOne({ userId }).populate('farm').exec();
        const crops = player.farm;

        if (row >= player.farmWidth || col >= player.farmWidth) {
            await interaction.reply({ content: 'Coordinates are out of bound', ephemeral: true });
            return;
        }

        const index = row * player.farmWidth + col;

        // Check if field is empty
        if (crops[index].name === 'Empty' || player.timer[index] === null) {
            await interaction.reply({ content: 'No crop is planted at that spot', ephemeral: true });
            return;
        }

        // Calculate time remaining
        const timeRemaining = ((player.timer[index].getTime() + crops[index].growthTime) - Date.now()) / 1000;

        if (timeRemaining < 0) {
            await interaction.reply({ content: 'Crop is ready for harvest', ephemeral: true });
        }
        else {
            await interaction.reply({ content: `${crops[index].name} will be mature in ${Math.round(timeRemaining)} seconds`, ephemeral: true });
        }
    },
};
