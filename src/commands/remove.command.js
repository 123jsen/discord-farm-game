const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const crops = require('../../data/crops/export.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a plant and get a 50% refund of its price')
        .addIntegerOption(option =>
			option
				.setName('row')
				.setDescription('Plant crop at row.')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('col')
				.setDescription('Plant crop at column.')
				.setRequired(true)),

    async execute(interaction) {
        const row = interaction.options.getInteger('row') - 1;
		const col = interaction.options.getInteger('col') - 1;

        const userId = interaction.user.id;
		const player = await Player.findOne({ userId }).exec();
		const farm = player.farm;

        const index = row * player.farmWidth + col;
        const targetCrop = crops.find(crop => crop.name === farm[index].name);

        // Check if land is empty
        if (farm[index].name === 'Empty') {
            await interaction.reply({ content: 'Farmland is empty', ephemeral: true });
            return;
        }

        // Check if crop is mature
        const current = (new Date).getTime();
        if (farm[index].timer.getTime() + targetCrop.growthTime < current) {
            await interaction.reply({ content: 'Crop is mature, use `/harvest` instead', ephemeral: true });
            return;
        }

        await Player.updateOne({ userId }, {
            $set: { 
                money: player.money + targetCrop.cost * 0.5,
                [`farm.${index}`]: {
                    name: 'Empty',
                    timer: new Date
                }
            }
        });

        await interaction.reply(`${targetCrop.name} removed and $${targetCrop.cost * 0.5} was refunded`);
    },
};
