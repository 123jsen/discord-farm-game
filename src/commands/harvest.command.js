// TODO: make line 30 arrays of promises

const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const Crop = require("../models/crop.model.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('harvest')
        .setDescription('Harvest all mature crops'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await Player.findOne({ userId }).populate('farm').exec();
        const crops = player.farm;
        const emptyCrop = await Crop.findOne({ name: "Empty" }).exec();

        // Check if each crop is mature
        const current = (new Date).getTime();
        let harvestGain = 0;

        for (let i = 0; i < player.farmWidth; i++) {
            for (let j = 0; j < player.farmWidth; j++) {
                const index = i * player.farmWidth + j;
                // Check if field is empty
                if (crops[index].name === "Empty" || player.timer[index] === null) continue;

                // Check if field is ready for harvest
                if (player.timer[index].getTime() + crops[index].growthTime < current) {
                    harvestGain += crops[index].worth;

                    await Player.updateOne({ userId }, {
                        $set: { [`farm.${index}`]: emptyCrop.id }
                    });
                }
            }
        }

        if (harvestGain === 0) {
            await interaction.reply({ content: 'Nothing was harvested', ephemeral: true });
        }
        else {
            await Player.updateOne({ userId }, {
                $set: { money: player.money + harvestGain }
            });
            await interaction.reply(`Harvested $${harvestGain}!`);
        }
    },
};
