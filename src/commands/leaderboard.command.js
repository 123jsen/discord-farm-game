// TODO: Show player names in leaderboard

const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the top five richest player'),
    async execute(interaction, player) {
        // -1 gives maximum
        const players = await Player.find().sort({ money: -1 }).limit(5).exec();

        if (!players) {
            await interaction.reply({ content: 'There are no players in the game', ephemeral: true })
            return;
        }

        let embedField = [];
        for (let i = 0; i < players.length; i++) {
            embedField.push({ name: `${i + 1}. ${players[i].farmName}`, value: `$${Math.round(players[i].money * 100) / 100}` });
        }

        const boardEmbed = new MessageEmbed()
            .setColor('#a84232')
            .setTitle('Leaderboard')
            .addFields(
                ...embedField
            )

        await interaction.reply({ embeds: [boardEmbed] });
    },
};


