// Imports from libraries
const fs = require('node:fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const mongoose = require("mongoose");
require('dotenv').config();

// Imports from project files
const { findOrCreatePlayer, findOrCreateServer } = require('./player.js');
const Player = require('./models/player.model.js');
const { checkAndResolveExpiredRace } = require('./services/prestige.service.js');

const dbUri = process.env.DISCORD_MONGODB_URI;
mongoose.connect(dbUri);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection to mongodb error"));

db.once("open", () => {
	console.log("connection to mongodb success");

	// Create a new client instance
	const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

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
		if (!interaction.isChatInputCommand()) return;

		const command = client.commands.get(interaction.commandName);

		console.log(`User ${interaction.user.username} Id: ${interaction.user.id} used /${interaction.commandName}`);

		if (!command) return;

		// Middleware
		const { player, isNew } = await findOrCreatePlayer(interaction);
		const server = await findOrCreateServer(interaction.guildId);
		await Player.updateProduction(player);
		await checkAndResolveExpiredRace(server);

		// Welcome message for new players
		if (isNew) {
			const welcomeChannel = server.welcomeChannelId
				? interaction.guild.channels.cache.get(server.welcomeChannelId)
				: interaction.guild.channels.cache.find(c => c.name === 'dodos-weed-farm');

			if (welcomeChannel) {
				welcomeChannel.send(`🌾 Welcome to Dodo's Weed Farm, <@${interaction.user.id}>! Use /help to get started.`);
			}
		}

		// Executing commands
		try {
			await command.execute(interaction, player, server);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	});


	// Login to Discord with your client's token
	client.login(process.env.DISCORD_CLIENT_TOKEN);
});