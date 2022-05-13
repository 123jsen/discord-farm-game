# Discord Farm Game
A discord bot with farming minigame

In this game, you will plant crops and harvest them for money. You will also need other resources like wood, metal and stone to upgrade your farm. Trade resources with your friends to make life easier for everyone.

## Installation

Make sure that Node.JS and yarn is installed in your computer. If yarn is not installed, type `npm install -g yarn` in your console.

After you clone the repo to a folder on your machine, type `yarn` at the project directory to download all required packages from NPM servers.

## Setup Discord Bot and developers settings

Follow `https://discordjs.guide/#before-you-begin` for the setup.

## Setup `.env`

Create `.env` at the project folder with the following fields:

```
CLIENT_ID
GUILD_ID
MONGODB_URI
CLIENT_TOKEN
```
## Running the bot

For each new server, `yarn commands` or `npm run commands` need to be run at least once to register all the commands. Run again if commands are changed. This command will execute `src/initialization/deploy-commands.js`, which will register commands at discord guild.

If `GUILD_ID` is missing in `.env`, then commands will be registered globally instead of at one server only.
