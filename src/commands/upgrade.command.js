const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const upgrades = require('../../data/upgrades/export.js');
const { checkEnoughMoney } = require('../player.js');


const choices = [];
upgrades.forEach(upgrade => {
    choices.push({
        name: upgrade.name,
        value: upgrade.target
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

        // Upgrade Option is value of option, i.e. farmWidth
        const upgradeOption = interaction.options.getString('type');

        // Category is object for that target
        const category = upgrades.find(upgrade => (upgrade.target === upgradeOption));

        const nextTier = category.levels.find(item => (item.level === (player[upgradeOption] + 1)));

        if (!nextTier) {
            await interaction.reply({ content: 'There is no next tier', ephemeral: true });
            return;
        }

        if (!checkEnoughMoney(nextTier.cost, player)) {
            await interaction.reply({ content: `You need $${nextTier.cost[0]}, ${nextTier.cost[1]} wood, ${nextTier.cost[2]} stone and ${nextTier.cost[3]} metal to upgrade ${category.name} to tier ${nextTier.level}`, ephemeral: true });
            return;
        }

        await Player.updateOne({ userId }, {
            $set: {
                money: player.money - nextTier.cost[0],
                wood: player.wood - nextTier.cost[1],
                stone: player.wood - nextTier.cost[2],
                metal: player.wood - nextTier.cost[3]
            }
        });

        if (upgradeOption === 'farmWidth') {
            const farm = player.farm;

            for (let i = player.farmArea; i < (player.farmWidth + 1) * player.farmHeight; i++) {
                farm.push({
                    name: 'Empty',
                    timer: new Date
                });
            }

            await Player.updateOne({ userId }, {
                $set: {
                    farm,
                    farmWidth: player.farmWidth + 1
                }
            });
        }

        if (upgradeOption === 'buildingSlots') {
            const building = player.building;

            building.push({
                name: 'Empty',
                level: 0
            });

            await Player.updateOne({ userId }, {
                $inc: {
                    buildingSlots: 1
                },
                $set: {
                    building,
                }
            });
        }

        await interaction.reply(`Spent $${nextTier.cost[0]}, ${nextTier.cost[1]} wood, ${nextTier.cost[2]} stone and ${nextTier.cost[3]} metal to upgrade ${category.name} to tier ${nextTier.level}`);
    },
};
