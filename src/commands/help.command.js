const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Instructions on the Game'),
    async execute(interaction) {
        const helpEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Dodo's Weed Farm 2.0`)
            .setURL('https://github.com/SenYanHo/discord-farm-game')
            .addFields(
                { name: 'How to Play', value: 'You plant crops in your field and wait for them to be mature. After that, you can harvest the crops and earn money. This allows you to plant more expensive crops and earn more money.\n\nAt first, each player starts with 100 gold and a 3x3 land. Once you collect enough gold, you can build resources buildings. Specializing in one type of resources will give you a bonus in production, so try to specialize and trade with your friends' },
                { name: '/list', value: 'List prices of crops and upgrades' },
                { name: '/farm', value: 'Shows your current farm plot' },
                { name: '/give', value: 'Give resources to another player' },
                { name: '/rename', value: 'Rename your farm' },
                { name: '/plantall', value: 'Plant as many as possible crops' },
                { name: '/check', value: 'Check when a crop is mature' },
                { name: '/harvest', value: 'Harvest all mature crops and sell them' },
                { name: '/leaderboard', value: 'Show the top 5 richest player' },
                { name: '/upgrade', value: 'Upgrade your farm' },
                { name: '/build', value: 'Build a building at a spot' },
                { name: '/destroy', value: 'Destroy a building and get 50% of its price back' })

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    },
};
