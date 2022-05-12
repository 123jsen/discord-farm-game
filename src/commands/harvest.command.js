const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const crops = require('../../data/crops/export.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('harvest')
        .setDescription('Harvest all mature crops'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const player = await Player.findOne({ userId }).exec();
        const farm = player.farm;

        // Check if each crop is mature
        const current = (new Date).getTime();
        let harvestGain = 0;

        const promises = [];
        for (let index = 0; index < player.farmArea; index++) {
            // Check if field is empty
            if (farm[index].name === 'Empty') continue;

            // Get crop from crops.json
            const { worth, growthTime } = crops.find(crop => crop.name === player.farm[index].name);

            // Check if field is ready for harvest
            if (farm[index].timer.getTime() + growthTime < current) {
                player.farm[index] = {
                    name: 'Empty',
                    timer: new Date
                }

                harvestGain += worth;
            }
        }

        if (harvestGain === 0) {
            await interaction.reply({ content: 'Nothing was harvested', ephemeral: true });
            return;
        }

        player.money += harvestGain;
        await player.save();
        
        await interaction.reply(`Harvested $${harvestGain}!`);
    },
};
