// Imports from libraries
const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const mongoose = require("mongoose");
require('dotenv').config();

// Imports from project files
const createPlayer = require('./create-player.js');

const dbUri = process.env.MONGODB_URI;
mongoose.connect(dbUri);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection to mongodb error"));

db.once("open", () => {
	console.log("connection to mongodb success");

	// Create a new client instance
	const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

	client.commands = new Collection();
	// fs uses absolute path
	const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		// require uses relative path
		const command = require(`./commands/${file}`);
		// Set a new item in the Collection
		// With the key as the command name and the value as the exported module
		client.commands.set(command.data.name, command);
		console.log(`Loaded command: /${command.data.name}`)
	}

	// When the client is ready, run this code (only once)
	client.once('ready', () => {
		console.log('Ready!');
	});

	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return;

		const command = client.commands.get(interaction.commandName);

		console.log(`User ${interaction.user.username} used /${interaction.commandName}`);

		if (!command) return;

		await createPlayer(interaction);

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	});


	// Login to Discord with your client's token
	client.login(process.env.CLIENT_TOKEN);
});