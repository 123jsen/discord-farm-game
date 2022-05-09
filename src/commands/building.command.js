const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');

const buildings = require('../../data/buildings/export.js');
const { checkEnoughMoney } = require('../player.js');
const choices = [];
buildings.forEach(build => {
    if (build.name !== 'Empty')
        choices.push({
            name: `${build.image} ${build.name}`,
            value: build.target
        });
})


module.exports = {
    data: new SlashCommandBuilder()
        .setName('build')
        .setDescription('Build a new building')
        .addIntegerOption(option =>
            option
                .setName('row')
                .setDescription('Build building at row.')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('col')
                .setDescription('Build building at column.')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Building type')
                .setRequired(true)
                .addChoices(...choices)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await Player.findOne({ userId }).exec();

        const row = interaction.options.getInteger('row') - 1;
        const col = interaction.options.getInteger('col') - 1;

        if (col >= player.buildingWidth) {
            await interaction.reply({ content: 'Coordinates are out of bound', ephemeral: true });
            return;
        }

        const index = row * player.buildingWidth + col;

        const buildOption = interaction.options.getString('type');
        const category = buildings.find(build => (build.target === buildOption));

        // Build new building if land is empty
        if (player.building[index].name === 'Empty') {
            const buildLevel = category.levels[0];
            if (!checkEnoughMoney(buildLevel.cost, player)) {
                await interaction.reply({ content: `You need $${buildLevel.cost[0]}, ${buildLevel.cost[1]} wood, ${buildLevel.cost[2]} stone and ${buildLevel.cost[3]} metal to build ${category.name}`, ephemeral: true });
                return;
            }

            // Update Player Currencies
            await Player.updateOne({ userId }, {
                $set: {
                    [`building.${index}`] : {
                        name: category.name,
                        level: 1
                    },
                    money: player.money - buildLevel.cost[0],
                    wood: player.wood - buildLevel.cost[1],
                    stone: player.wood - buildLevel.cost[2],
                    metal: player.wood - buildLevel.cost[3]
                }
            });

            if (buildOption === 'farmHeight') {
                const farm = player.farm;
    
                for (let i = player.farmArea; i < player.farmArea + player.farmHeight; i++) {
                    farm.push({
                        name: 'Empty',
                        timer: new Date
                    });
                }
    
                await Player.updateOne({ userId }, {
                    $set: {
                        farm,
                        farmHeight: player.farmHeight + 1
                    }
                });
            }

            await interaction.reply(`Spent $${buildLevel.cost[0]}, ${buildLevel.cost[1]} wood, ${buildLevel.cost[2]} stone and ${buildLevel.cost[3]} metal to build ${category.name}`);
        }
        // Check for match and upgrade existing building
        else {

        }
    },
};
