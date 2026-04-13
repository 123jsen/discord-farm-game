const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const cropList = require('../../data/crops/export.js');
const { checkAllCrops } = require('../services/farm.service.js');

function formatTime(secs) {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('Show all crops in progress, grouped by type and time remaining'),

    async execute(interaction, player) {
        const groups = checkAllCrops(player, cropList);

        if (groups.length === 0) {
            return interaction.reply({ content: 'Your farm is empty.', ephemeral: true });
        }

        const allReady = groups.every(g => g.batches.length === 0);
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🌾 Farm Status')
            .setFooter({ text: allReady ? 'All crops ready — use /harvest!' : 'Use /harvest to collect ready crops' });

        for (const group of groups) {
            const lines = [];
            if (group.ready > 0) lines.push(`✅ **${group.ready}** ready to harvest`);
            for (const batch of group.batches) {
                lines.push(`⏳ **${batch.count}** — ${formatTime(batch.secs)}`);
            }
            embed.addFields({ name: `${group.image} ${group.name}`, value: lines.join('\n'), inline: true });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
