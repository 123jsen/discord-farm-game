const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Instructions on the Game'),
    async execute(interaction) {
        const helpEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Help')
            .setURL('https://github.com/SenYanHo/discord-farm-game')
            .addFields(
                { name: 'How to Play', value: 'You plant crops in your field and wait for them to be mature. After that, you can harvest the crops and earn money. This allows you to plant more expensive crops and earn more money.\n\nAt first, each player starts with 100 gold and a 3x3 land. You can upgrade your farm using gold in the future.' },
                { name: '/farm', value: 'Shows your current farm plot' },
                { name: '/plant', value: 'Plant crop at target location' },
                { name: '/check', value: 'Check when a crop is mature' },
                { name: '/harvest', value: 'Harvest all mature crops and sell them' })

        await interaction.reply({ embeds: [helpEmbed] });
    },
};
