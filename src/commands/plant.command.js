const { SlashCommandBuilder } = require('discord.js');
const cropList = require('../../data/crops/export.js');
const farmService = require('../services/farm.service.js');

const cropChoices = [];
cropList.forEach(crop => {
	if (crop.name !== 'Empty')
		cropChoices.push({
			name: `${crop.image} ${crop.name} Cost:$${crop.cost}`,
			value: crop.name
		});
})

module.exports = {
	data: new SlashCommandBuilder()
		.setName('plant')
		.setDescription('Plant crop at target location')
		.addIntegerOption(option =>
			option.setName('row').setDescription('Plant crop at row.').setRequired(true))
		.addIntegerOption(option =>
			option.setName('col').setDescription('Plant crop at column.').setRequired(true))
		.addStringOption(option =>
			option.setName('seed').setDescription('Crop to be planted').setRequired(true)
				.addChoices(...cropChoices)),

	async execute(interaction, player) {
		const row = interaction.options.getInteger('row') - 1;
		const col = interaction.options.getInteger('col') - 1;
		const seed = interaction.options.getString('seed');

		const result = await farmService.plant(player, row, col, seed, cropList);
		if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
		await interaction.reply(result.message);
	},
};
