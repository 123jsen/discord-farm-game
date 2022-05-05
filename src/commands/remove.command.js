const { SlashCommandBuilder } = require('@discordjs/builders');
const Player = require('../models/player.model.js');
const Crop = require("../models/crop.model.js");

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
		const player = await Player.findOne({ userId }).populate('farm').exec();
		const crops = player.farm;
        const emptyCrop = await Crop.findOne({ name: "Empty" }).exec();

        const index = row * player.farmWidth + col;

        // Check if land is empty
        if (crops[index].name === 'Empty') {
            await interaction.reply({ content: 'Farmland is empty', ephemeral: true });
            return;
        }

        // Check if crop is mature
        const current = (new Date).getTime();
        if (player.timer[index].getTime() + crops[index].growthTime < current) {
            await interaction.reply({ content: 'Crop is mature, use `/harvest` instead', ephemeral: true });
            return;
        }

        await Player.updateOne({ userId }, {
            $set: { 
                money: player.money + crops[index].cost * 0.5,
                [`farm.${index}`]: emptyCrop.id
            }
        });

        await interaction.reply(`${crops[index].name} removed and $${crops[index].cost * 0.5} was refunded`);
    },
};
