const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('plant')
		.setDescription('Plant crop at target location.'),
	async execute(interaction) {
		await interaction.reply('TODO');
	},
};

