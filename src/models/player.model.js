const mongoose = require("mongoose");

const buildings = require('../../data/buildings/export.js');

const Schema = mongoose.Schema;

const PlayerSchema = Schema({
    // User Data
    userId: { type: String, required: true, unique: true },
    farmName: { type: String, required: true, default: 'Farm' },

    // Currency
    money: { type: Number, required: true, default: 0 },
    wood: { type: Number, required: true, default: 0 },
    stone: { type: Number, required: true, default: 0 },
    metal: { type: Number, required: true, default: 0},

    lastHarvested: { type: Date, default: new Date},

    // Productivity
    woodCapacity: { type: Number, default: 0},
    stoneCapacity: { type: Number, default: 0},
    metalCapacity: { type: Number, default: 0},

    // Plot Detail
    farmWidth: { type: Number, required: true, default: 3 },
    farmHeight: { type: Number, required: true, default: 3 },
    farm: [{
        name: { type: String, default: 'Empty' },
        timer: { type: Date, default: new Date }
    }],

    // Building Detail
    // Building Width is always 2
    buildingSlots: { type: Number, required: true, default: 4 },
    building: [{
        name: { type: String, default: 'Empty' },
        level: { type: String, default: 0 }
    }]
});

// VERY IMPORTANT NOTE: Arrow functions do not support 'this'

// Define constant Building Width
PlayerSchema.virtual('buildingWidth').get(() => {
    return 2;
});

// Define Farm Area
PlayerSchema.virtual('farmArea').get(function() {
    return this.farmWidth * this.farmHeight;
});

// This static method checks buildings and update 
PlayerSchema.static('updateOneProduction', async function(document) {
    document.woodCapacity = 0;
    document.stoneCapacity = 0;
    document.metalCapacity = 0;

    const woodFarm = buildings.find(build => build.target === 'wood');
    const stoneFarm = buildings.find(build => build.target === 'stone');
    const metalFarm = buildings.find(build => build.target === 'metal');

    let woodCount = 0;
    let stoneCount = 0;
    let metalCount = 0;

    for (let i = 0; i < document.buildingSlots; i++)
    {
        const level = document.building[i].level;

        if (document.building[i].name === 'Lumber Mill') {
            woodCount ++;
            document.woodCapacity += woodFarm.levels[level - 1].effect;
        }
        else if (document.building[i].name === 'Stone Quarry') {
            stoneCount ++;
            document.stoneCapacity += stoneFarm.levels[level - 1].effect;
        }
        else if (document.building[i].name === 'Recycling Shop') {
            metalCount ++;
            document.metalCapacity += metalFarm.levels[level - 1].effect;
        }
    }

    if (woodCount == 1) document.woodCapacity *= 1.0;
    if (woodCount == 2) document.woodCapacity *= 1.4;
    if (woodCount >= 3) document.woodCapacity *= 2.0;

    if (stoneCount == 1) document.stoneCapacity *= 1.0;
    if (stoneCount == 2) document.stoneCapacity *= 1.4;
    if (stoneCount >= 3) document.stoneCapacity *= 2.0;

    if (metalCount == 1) document.metalCapacity *= 1.0;
    if (metalCount == 2) document.metalCapacity *= 1.4;
    if (metalCount >= 3) document.metalCapacity *= 2.0;

    await document.save();
});

// Update lastHarvested
PlayerSchema.static('calculateProduction', async function(userId) {
    // Find player
    let player = await this.findOne({ userId }).exec();

    // Time in milliseconds
    const timePassed = Date.now() - player.lastHarvested.getTime();
    const hourPassed = timePassed / (1000 * 60 * 60);

    player.wood += hourPassed * player.woodCapacity;
    player.stone += hourPassed * player.stoneCapacity;
    player.metal += hourPassed * player.metalCapacity;

    player.lastHarvested = new Date;

    await player.save();
})

module.exports = mongoose.model("Player", PlayerSchema);