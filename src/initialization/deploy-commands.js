const fs = require('node:fs');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [];
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`../commands/${file}`);
	commands.push(command.data.toJSON());
	console.log(`Registered command /${command.data.name}`);
}
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_CLIENT_TOKEN);

if (process.env.DISCORD_GUILD_ID) {
	console.log('Guild ID found');
	rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, process.env.DISCORD_GUILD_ID), { body: commands })
		.then(() => console.log('Successfully registered application commands for guild.'))
		.catch(console.error);
}

else {
	console.log('Guild ID not found');
	rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID), { body: commands })
		.then(() => console.log('Successfully registered application commands globally (updates may take an hour).'))
		.catch(console.error);
}
