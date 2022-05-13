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

    async execute(interaction, player) {
        const seed = interaction.options.getString('seed');

        const newCrop = cropList.find(crop => crop.name === seed);

        if (!newCrop) {
            await interaction.reply({ content: `Crop named ${newCrop.name} is not found`, ephemeral: true });
            return;
        }

        let cropPlanted = 0;
        let occupiedField = 0;

        for (let index = 0; index < player.farmArea; index++) {
            if (player.farm[index].name !== "Empty") {
                occupiedField++;
                continue;
            }

            // Player has enough money
            if (player.money >= newCrop.cost) {
                player.farm[index] = {
                    name: newCrop.name,
                    timer: new Date
                }

                cropPlanted++;
                player.money -= newCrop.cost;
            }
        }

        if (cropPlanted == 0) {
            if (occupiedField == player.farmArea)
                await interaction.reply({ content: 'No crops are planted. The farm is full', ephemeral: true });
            else
                await interaction.reply({ content: `No crops are planted. You have $${player.money}`, ephemeral: true });
            return;
        }

        player.save();

        await interaction.reply(`Spent $${cropPlanted * newCrop.cost} and planted ${cropPlanted} ${newCrop.name} in total`);
    },
};

