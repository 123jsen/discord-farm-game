const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const crops = require('../../data/crops/export.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rename')
        .setDescription('Rename your farm')
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('Name of your farm')
                .setRequired(true)),

    async execute(interaction, player) {
        const newName = interaction.options.getString('name');

        await Player.updateOne({ userId: interaction.user.id }, {
            $set: {
                farmName: newName
            }
        });

        await interaction.reply({ content: `Farm name now changed to ${newName}`, ephemeral: true});
    },
};
