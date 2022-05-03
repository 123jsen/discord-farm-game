const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const Crop = require("../models/crop.model.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('Check the progress of crops'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await Player.findOne({ userId }).populate('farm').exec();
        const crops = player.farm;
        const emptyCrop = await Crop.findOne({ name: "Empty" }).exec();
    },
};
