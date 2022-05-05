const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

const commands = [];
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
	console.log(`Registered command /${command.data.name}`);
}
const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN);

if (process.env.GUILD_ID) {
	console.log('Guild ID found');
	rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
		.then(() => console.log('Successfully registered application commands for guild.'))
		.catch(console.error);
}
	
else {
	console.log('Guild ID not found');
	rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
		.then(() => console.log('Successfully registered application commands globally (updates may take an hour).'))
		.catch(console.error);
}
