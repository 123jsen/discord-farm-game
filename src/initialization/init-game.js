// Handle arguments to init-game
const arguments = process.argv.slice(2);
let deleteFlag = false;

if (arguments.length === 0) console.log('Running default setup');

if (arguments.includes('-h')) {
    const { content } = require('./help.json');
    console.log(content);
    process.exit(0);
}

if (arguments.includes('-d')) {
    deleteFlag = true;
    console.log("Delete Flag: True");
}

// Database
const Crop = require('../models/crop.model.js');
const Player = require('../models/player.model.js');
const cropList = require('../../data/crops.json');

const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI;
mongoose.connect(dbUri);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection to mongodb error'));

db.once('open', async () => {
    console.log('Connection to mongoDB server Success');

    if (deleteFlag) {
        await Crop.deleteMany({});
        console.log('Deleted all crops');
        await Player.deleteMany({});
        console.log('Deleted all players');
    }

    const promises = [];
    
    cropList.forEach(crop => {
        promises.push(addCrop(crop));
    })

    Promise
        .all(promises)
        .then(() => {
            console.log('init-game success');
            process.exit(0);
        })
});

async function addCrop(cropObj) {
    try {
        await Crop.create(cropObj);
        console.log(`Added ${cropObj.name}`);
    } catch (error) {
        if (error.name === 'MongoServerError' && error.code === 11000)
            console.log(`Already found in database: ${cropObj.name}`)
        else
            console.log(error);
    }
}