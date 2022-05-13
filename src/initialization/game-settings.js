// Handle arguments to init-game
const arguments = process.argv.slice(2);
let deleteFlag = false;
let cheatFlag = false;

if (arguments.length === 0) {
    console.log('Use -h for to know all options');
}

if (arguments.includes('-h')) {
    const { content } = require('./help.json');
    console.log(content);
    process.exit(0);
}

if (arguments.includes('--delete')) {
    deleteFlag = true;
    console.log("Delete Flag: True");
}

if (arguments.includes('--cheat')) {
    cheatFlag = true;
    console.log("Cheat Flag: True");
}

// Database
const Player = require('../models/player.model.js');

const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI;
mongoose.connect(dbUri);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection to mongodb error'));

db.once('open', async () => {
    console.log('=====')
    console.log('Connection to mongoDB server Success');

    const players = await Player.find({});

    for (let i = 0; i < players.length; i++)
    {
        console.log(`Player ${i} name: ${players[i].farmName} userId: ${players[i].userId}`);
    }

    if (deleteFlag) {
        await Player.deleteMany({});
        console.log('Deleted all player data');
    }

    if (cheatFlag) {
        for (let i = 0; i < players.length; i++)
        {
            players[i].money += 100000000;
            players[i].wood += 100000000;
            players[i].stone += 100000000;
            players[i].metal += 100000000;
            await players[i].save();
        }
    }

    console.log('=====')
    process.exit(0);
});