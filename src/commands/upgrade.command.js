const { SlashCommandBuilder } = require('@discordjs/builders');
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

    async execute(interaction, player) {
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

        player.money -= nextTier.cost[0];
        player.wood -= nextTier.cost[1];
        player.stone -= nextTier.cost[2];
        player.metal -= nextTier.cost[3];


        if (upgradeOption === 'farmWidth') {
            player.farmWidth++;

            // If farmWidth increases, then there are farmHeight more plots.
            const extraFarm = Array(player.farmHeight).fill({
                name: 'Empty',
                timer: new Date
            });

            player.farm.push(...extraFarm);
        }

        if (upgradeOption === 'buildingSlots') {
            player.building.push({
                name: 'Empty',
                level: 0
            });

            player.buildingSlots++;
        }

        player.save();

        await interaction.reply(`Spent $${nextTier.cost[0]}, ${nextTier.cost[1]} wood, ${nextTier.cost[2]} stone and ${nextTier.cost[3]} metal to upgrade ${category.name} to tier ${nextTier.level}`);
    },
};
