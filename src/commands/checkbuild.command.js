const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const buildingsList = require('../../data/buildings/export.js');
const { checkAllBuildings } = require('../services/build.service.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkbuild')
        .setDescription('Show all buildings and their current levels'),

    async execute(interaction, player) {
        const groups = checkAllBuildings(player, buildingsList);

        const emptyCount = player.building.slice(0, player.buildingSlots).filter(b => b.name === 'Empty').length;

        if (groups.length === 0) {
            return interaction.reply({ content: 'You have no buildings constructed yet.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🏗️ Building Status')
            .setFooter({ text: `${emptyCount} empty slot${emptyCount !== 1 ? 's' : ''} available` });

        for (const group of groups) {
            const lines = group.slots.map(s => {
                const levelStr = `Lv ${s.level}/${group.maxLevel}`;
                const effectStr = s.effect != null ? ` — +${s.effect}/hr` : '';
                return `📍 Row ${s.row}, Col ${s.col} — ${levelStr}${effectStr}`;
            });
            embed.addFields({ name: `${group.image} ${group.name}`, value: lines.join('\n'), inline: false });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
