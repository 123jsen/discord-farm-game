const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const buildings = require('../../data/buildings/export.js');
const Player = require('../models/player.model.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('visit')
        .setDescription(`Visit someone else's farm`)
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('Use @ to mention target')
                .setRequired(true)),

    async execute(interaction, player) {
        const targetId = interaction.options.getUser('target').id;

        const targetPlayer = await Player.findOne({ userId: targetId });

        if (!targetPlayer) {
            await interaction.reply({ content: 'That player is not found', ephemeral: true });
            return;
        }

        await Player.updateProduction(targetPlayer);

        let resourceStr = '';
        resourceStr = resourceStr.concat(`🪙 $${Math.round(targetPlayer.money)} \n`);
        resourceStr = resourceStr.concat(`🪵 ${Math.round(targetPlayer.wood)} (+ ${Math.round(targetPlayer.woodCapacity)}/hr)\n`);
        resourceStr = resourceStr.concat(`🪨 ${Math.round(targetPlayer.stone)} (+ ${Math.round(targetPlayer.stoneCapacity)}/hr)\n`);
        resourceStr = resourceStr.concat(`🔧 ${Math.round(targetPlayer.metal)} (+ ${Math.round(targetPlayer.metalCapacity)}/hr)\n`);

        let buildStr = '';
        for (let i = 0; i < targetPlayer.buildingSlots; i++) {
            if ((i !== 0) && ((i % targetPlayer.buildingWidth) === 0))
                buildStr = buildStr.concat("\n");
                
            const { image } = buildings.find(build => build.name === targetPlayer.building[i].name);
            buildStr = buildStr.concat(image);
        }

        const farmEmbed = new MessageEmbed()
            .setColor('#a84232')
            .setTitle(targetPlayer.farmName)
            .addFields(
                { name: 'Resouces', value: resourceStr},
                { name: 'Buildings', value: buildStr }
            )
        await interaction.reply({ embeds: [farmEmbed] , ephemeral: true});
    },
};
