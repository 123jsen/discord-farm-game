const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('farm')
        .setDescription('Shows current farm plot'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await Player.findOne({ userId }).populate('farm').exec();
        const crops = player.farm;

        let farmStr = "";
        for (let i = 0; i < player.farmWidth; i++) {
            for (let j = 0; j < player.farmWidth; j++) {
                farmStr = farmStr.concat(crops[i * player.farmWidth + j].image);
            }
            farmStr = farmStr.concat("\n");
        }

        const farmEmbed = new MessageEmbed()
            .setColor('#a84232')
            .setTitle(`${interaction.user.username}'s farm`)
            .addFields(
                { name: 'Money', value: `${player.money}` },
                { name: 'Farm', value: farmStr }
            )
        await interaction.reply({ embeds: [farmEmbed] });
    },
};
