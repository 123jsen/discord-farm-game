# Dodo's Weed Farm

This project was done by hand originally until 2022 May. It is recently revived by me and claude just to play with it.

A Discord bot farming minigame. Plant crops, harvest them for money, build resource-producing buildings, trade with other players, and prestige to earn permanent income multipliers.

---

## Gameplay Overview

- Start with $69 and a 3×3 farm
- Plant crops and wait for them to mature, then `/harvest` for money
- Build **Lumber Mills**, **Stone Quarries**, and **Recycling Shops** to produce resources passively
- Use resources to upgrade your farm width, building slots, and building levels
- Trade resources with other players via contracts
- **Prestige** by initiating a server-wide harvest race — complete it to reset your farm and earn a permanent ×1.15 income multiplier (stacks each prestige)
- Unlock **15 achievements** across all aspects of the game

---

## Commands

| Command | Description |
|---------|-------------|
| `/farm` | View your current farm and stats |
| `/visit` | Visit another player's farm |
| `/list` | Browse prices for crops, buildings, upgrades, and contracts |
| `/plant` | Plant a crop at a specific plot |
| `/plantall` | Fill all empty plots with a crop |
| `/check` | Check when a crop at a position will be mature |
| `/harvest` | Harvest all mature crops and earn money |
| `/upgrade` | Upgrade farm width or building slots |
| `/build` | Build or upgrade a building at a slot |
| `/checkbuild` | Check what building is at a slot |
| `/destroy` | Demolish a building and get a partial refund |
| `/buy` | Buy resources with money |
| `/give` | Give resources to another player |
| `/makecontract` | Post a contract to sell resources |
| `/buycontract` | Buy from a posted contract |
| `/deletecontract` | Cancel your own contract |
| `/leaderboard` | Top 5 players by money, with achievement count |
| `/rename` | Rename your farm |
| `/prestige` | Initiate a server-wide harvest race to prestige |
| `/race` | Check current race progress and time remaining |
| `/achievements` | View your unlocked achievements |
| `/help` | Paginated guide: commands, tradeoffs, buildings, prestige |
| `/setchannel` | (Admin) Set the channel for welcome messages |

---

## Prestige System

1. Accumulate **$500,000 + 100,000 of each resource**
2. Use `/prestige` to spend them and start a 1-hour server-wide harvest race
3. Every player who harvests during the race contributes to the crop target
4. **Success** → initiating player's farm resets, earns a permanent ×1.15 income multiplier
5. **Failure** → 30% cost refunded, 1-hour cooldown before another attempt

Race targets double each prestige (250 → 500 → 1,000 → 2,000 → …).

---

## Achievements

There are 15 achievements. They are **never reset on prestige**.

| Achievement | How to unlock |
|-------------|---------------|
| 🌱 First Harvest | Harvest your first crop |
| 🪴 Green Thumb | Harvest 100 crops total |
| 🏭 Mass Producer | Harvest 5,000 crops total |
| 🧪 Mad Scientist | Harvest a Mutant Strain crop |
| 💰 Getting Started | Accumulate $1,000 |
| 🤑 Millionaire | Accumulate $1,000,000 |
| 🔨 Builder | Construct your first building |
| 🏗️ Architect | Fill all building slots |
| ⭐ Specialist | Have 3 of the same building type |
| 📋 Market Maker | Post your first contract |
| 🤝 Trader | Buy from a contract |
| 🎁 Generous | Give resources to another player |
| 🗺️ Full Farm | Upgrade farm width to maximum (7) |
| 🔄 The Reset | Prestige for the first time |
| 🏆 Veteran | Prestige 5 times |

---

## Project Structure

```
src/
├── app.js                        # Bot entry point, middleware, event loop
├── player.js                     # findOrCreatePlayer, findOrCreateServer
├── commands/                     # One file per slash command
├── services/
│   ├── farm.service.js           # plant, plantAll, harvest, checkCrop
│   ├── build.service.js          # build, destroy, checkBuild
│   ├── upgrade.service.js        # upgrade (farmWidth, buildingSlots)
│   ├── trade.service.js          # give, makeContract, buyContract, deleteContract, buyResource
│   ├── prestige.service.js       # initiateRace, resolveRaceSuccess/Failure, checkAndResolveExpiredRace
│   └── achievement.service.js    # tryUnlock, formatUnlocked
├── models/
│   ├── player.model.js           # Player schema + static methods
│   ├── server.model.js           # Server schema (race state, welcome channel)
│   └── contract.model.js         # Contract schema
└── initialization/
    ├── deploy-commands.js        # Register slash commands with Discord
    └── game-settings.js          # Dev utility: list/delete/cheat players

data/
├── crops/
│   ├── crops.json                # Standard crops (Carrot → Rice)
│   └── weeds.json                # Premium crops (Homegrown → Mutant Strain)
├── buildings/
│   └── buildings.json            # Lumber Mill, Stone Quarry, Recycling Shop, Extra Plots
├── upgrades/
│   ├── farmWidth.json            # Farm width upgrade tiers (3→7)
│   └── buildSlots.json           # Building slot upgrade tiers
├── achievements.json             # Achievement definitions
└── config.json                   # DEFAULT_MONEY, GOLD_PER_RESOURCES, REFUND_PERCENT

tests/
└── services/                     # Jest unit tests for all services
```

---

## Setup

### 1. Prerequisites

- Node.js >= 16.11.0
- A MongoDB database (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Discord application and bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
DISCORD_APP_ID=        # Discord Developer Portal > Your App > OAuth2 > Client ID
DISCORD_GUILD_ID=      # Right-click your server > Copy Server ID (leave blank to register globally)
DISCORD_CLIENT_TOKEN=  # Discord Developer Portal > Your App > Bot > Token
DISCORD_MONGODB_URI=   # MongoDB connection string
```

### 4. Register slash commands

Run once per server, and again whenever commands are added or changed:

```bash
npm run commands
```

If `DISCORD_GUILD_ID` is set, commands register to that server instantly. If left blank, they register globally (takes up to 1 hour).

### 5. Start the bot

```bash
npm start
```

For persistent hosting, use a process manager like [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start npm --name "farm-bot" -- start
pm2 save
```

---

## Docker

A `Dockerfile` is included for containerised deployment:

```bash
docker build -t discord-farm-game .
docker run --env-file .env discord-farm-game
```

---

## Running Tests

```bash
npm test
```

---

## Tech Stack

- [discord.js](https://discord.js.org/) v14
- [Mongoose](https://mongoosejs.com/) v8 / MongoDB
- [Jest](https://jestjs.io/) for unit tests
