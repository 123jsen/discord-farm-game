const { SlashCommandBuilder } = require('discord.js');
const { SMOKE_COST, getSmokeLine } = require('../services/smoke.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('smoke')
        .setDescription(`Spend $${SMOKE_COST.toLocaleString()} for a moment of clarity`),

    async execute(interaction, player) {
        if (player.money < SMOKE_COST) {
            return interaction.reply({
                content: `You can't afford this. You need $${SMOKE_COST.toLocaleString()} and you have $${Math.floor(player.money).toLocaleString()}. Not even vibes are free.`,
                ephemeral: true,
            });
        }

        player.money -= SMOKE_COST;
        await player.save();

        const line = getSmokeLine(player);
        await interaction.reply(`💨 *${line}*`);
    },
};
