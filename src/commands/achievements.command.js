const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const achievementList = require('../../data/achievements.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('View your achievements'),
    async execute(interaction, player) {
        const unlocked = new Set(player.achievements.map(a => a.name));

        const fields = achievementList.map(a => {
            const earned = unlocked.has(a.name);
            return {
                name: earned ? `${a.icon} ${a.name}` : `🔒 ${a.name}`,
                value: earned ? a.description : '???',
                inline: true
            };
        });

        const total = achievementList.length;
        const count = unlocked.size;

        const embed = new EmbedBuilder()
            .setColor('#f5a623')
            .setTitle(`🏆 Achievements (${count}/${total})`)
            .addFields(...fields);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
