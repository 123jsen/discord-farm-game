const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const cropList = require('../../data/crops/export.js');

const cropChoices = [];
cropList.forEach(crop => {
    if (crop.name !== 'Empty')
        cropChoices.push({
            name: `${crop.image} ${crop.name} Cost:$${crop.cost}`,
            value: crop.name
        });
})

// name must be lowercase
// description cannot be absent
module.exports = {
    data: new SlashCommandBuilder()
        .setName('plantall')
        .setDescription('Plant crop at all fields, or until insufficient money')
        .addStringOption(option =>
            option
                .setName('seed')
                .setDescription('Crop to be planted')
                .setRequired(true)
                .addChoices(...cropChoices)),

    async execute(interaction) {
        const seed = interaction.options.getString('seed');

        const userId = interaction.user.id;

        const player = await Player.findOne({ userId }).exec();
        const crops = player.farm;

        const newCrop = cropList.find(crop => crop.name === seed);

        if (!newCrop) {
            await interaction.reply({ content: `Crop named ${newCrop.name} is not found`, ephemeral: true });
            return;
        }

        let cropPlanted = 0;
        let occupiedField = 0;
        let totalCost = 0;
        let index = 0;

        const promises = [];

        for (index = 0; index < player.farmArea; index++) {
            if (crops[index].name !== "Empty") {
                occupiedField++;
                continue;
            }

            // Player has enough money
            if (player.money >= totalCost + newCrop.cost) {
                promises.push(
                    Player.updateOne({ userId }, {
                        $set: {
                            [`farm.${index}`]: {
                                name: newCrop.name,
                                timer: new Date
                            }
                        }
                    })
                )
                
                cropPlanted++;
                totalCost += newCrop.cost;
            }
        }

        if (promises.length === 0) {
            if (occupiedField === player.farmWidth * player.farmHeight)
                await interaction.reply({ content: 'No crops are planted. The farm is full', ephemeral: true });
            else
                await interaction.reply({ content: `No crops are planted. You have $${player.money}`, ephemeral: true });
            return;
        }

        Promise
            .all(promises)
            .then(async () => {
                await Player.updateOne({ userId }, {
                    $set: {
                        money: player.money - totalCost
                    }
                })
                await interaction.reply(`Spent $${totalCost} and planted ${cropPlanted} ${newCrop.name} in total`)
            })
    },
};

