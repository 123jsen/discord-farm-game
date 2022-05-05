const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const Crop = require("../models/crop.model.js");

const upgradeList = require('../../data/upgrades.json');
const choices = [];
upgradeList.forEach(upgrade => {
    choices.push({
        name: upgrade.type,
        value: upgrade.type
    });
})


module.exports = {
    data: new SlashCommandBuilder()
        .setName('upgrade')
        .setDescription('Upgrade your farm and tools')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Item to be upgraded')
                .setRequired(true)
                .addChoices(...choices)),

    async execute(interaction) {

        const userId = interaction.user.id;
        const player = await Player.findOne({ userId }).exec();

        const upgradeOption = interaction.options.getString('type');

        const farmUpgrades = upgradeList.find(element => (element.type === 'farmWidth'));
        const nextTier = farmUpgrades.upgrades.find(element => (element.tier === (player.farmWidth + 1)));

        if (player.money >= nextTier.cost) {

            await Player.updateOne({ userId }, {
                $set: {
                    money: player.money - nextTier.cost
                }
            });

            if (upgradeOption === 'farmWidth') {
                const newFarm = player.farm;
                const newTimer = player.timer;
                const emptyCrop = await Crop.findOne({ name: "Empty" }).exec();

                for (let i = player.farmWidth ** 2; i < (player.farmWidth + 1) ** 2; i++) {
                    newFarm.push(emptyCrop.id);
                    newTimer.push(null);
                }

                await Player.updateOne({ userId }, {
                    $set: {
                        farm: newFarm,
                        timer: newTimer,
                        farmWidth: player.farmWidth + 1
                    }
                });
            }
            await interaction.reply(`Spent $${nextTier.cost} to upgrade ${upgradeOption} to tier ${nextTier.tier}\n`);

        } else {
            await interaction.reply({ content: `You need $${nextTier.cost} to upgrade ${upgradeOption} to tier ${nextTier.tier}\n`, ephemeral: true });
        }

    },
};
