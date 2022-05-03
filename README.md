# discord-farm-game
A discord bot with farming minigame

## Installation

After you clone the repo to a folder on your machine, use `yarn` to download all required packages.

### Setup Discord Bot and developers settings

Follow `https://discordjs.guide/#before-you-begin` for the setup.

### Setup `.env`

Create `.env` at the project folder with the following fields:

```
CLIENT_ID
GUILD_ID
MONGODB_URI
CLIENT_TOKEN
```
## Running the bot

Make sure that `init-game.js` is ran before starting to bot to update the database.
For each new server, `deploy-command.js` needs to be run once to register all the commands. Run again if commands are changed.
