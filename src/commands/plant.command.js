const { SlashCommandBuilder } = require('@discordjs/builders');
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
		.setName('plant')
		.setDescription('Plant crop at target location')
		.addIntegerOption(option =>
			option
				.setName('row')
				.setDescription('Plant crop at row.')
				.setRequired(true))
		.addIntegerOption(option =>
			option
				.setName('col')
				.setDescription('Plant crop at column.')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('seed')
				.setDescription('Crop to be planted')
				.setRequired(true)
				.addChoices(...cropChoices)),

	async execute(interaction, player) {
		// Need offset by 1
		const row = interaction.options.getInteger('row') - 1;
		const col = interaction.options.getInteger('col') - 1;
		
		const seed = interaction.options.getString('seed');

		const newCrop = cropList.find(crop => crop.name === seed);

		if (row >= player.farmHeight || col >= player.farmWidth) {
			await interaction.reply({ content: 'Coordinates are out of bound', ephemeral: true });
			return;
		}

		if (player.money < newCrop.cost) {
			await interaction.reply({ content: `You don't have enough money. (You need $${newCrop.cost} and you have $${player.money})`, ephemeral: true });
			return;
		}

		// Calculate index (row major ordering)
		const index = row * player.farmWidth + col;

		if (player.farm[index].name !== "Empty") {
			await interaction.reply({ content: 'Farmland is not empty', ephemeral: true });
			return;
		}

		player.farm[index] = {
			name: newCrop.name,
			timer: new Date
		}
		player.money -= newCrop.cost;

		player.save();

		await interaction.reply(`Spent $${newCrop.cost} and planted ${newCrop.name}\n`);
	},
};

