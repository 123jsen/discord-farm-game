// Initialize crops list

const Crop = require('../models/crop.model.js');
const cropList = require('../data/crops.json');

const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI;
mongoose.connect(dbUri);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection to mongodb error'));

db.once('open', async () => {
    console.log('Connection to mongoDB server Success');

    await Crop.deleteMany({});
    console.log('Deleted all crops');

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
    await Crop.create(cropObj);
    console.log(`Added ${cropObj.name}`);
}