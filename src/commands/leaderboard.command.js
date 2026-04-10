// TODO: Show player names in leaderboard

const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
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
            const p = players[i];
            const achievementCount = p.achievements ? p.achievements.length : 0;
            embedField.push({
                name: `${i + 1}. ${p.farmName}`,
                value: `$${Math.round(p.money * 100) / 100} · 🏆 ${achievementCount} achievement${achievementCount !== 1 ? 's' : ''}`
            });
        }

        const boardEmbed = new EmbedBuilder()
            .setColor('#a84232')
            .setTitle('Leaderboard')
            .addFields(
                ...embedField
            )

        await interaction.reply({ embeds: [boardEmbed] });
    },
};


