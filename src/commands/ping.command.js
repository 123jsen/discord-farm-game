const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hello')
		.setDescription('Replies with Star Wars Memes!'),
	async execute(interaction) {
		await interaction.reply('General Kenobi!');
	},
};
