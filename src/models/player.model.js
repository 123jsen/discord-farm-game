const mongoose = require("mongoose");

const buildings = require('../../data/buildings/export.js');
const { BUILDING_SYNERGY, DEFAULT_FARM_WIDTH, DEFAULT_FARM_HEIGHT, DEFAULT_BUILDING_SLOTS } = require('../constants.js');

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
    farmWidth: { type: Number, required: true, default: DEFAULT_FARM_WIDTH },
    farmHeight: { type: Number, required: true, default: DEFAULT_FARM_HEIGHT },
    farm: [{
        name: { type: String, default: 'Empty' },
        timer: { type: Date, default: new Date }
    }],

    // Prestige
    prestigeCount: { type: Number, default: 0 },

    // Achievements (preserved through prestige)
    achievements: [{
        name: { type: String },
        unlockedAt: { type: Date }
    }],
    totalCropsHarvested: { type: Number, default: 0 },

    // Building Detail
    // Building Width is always 2
    buildingSlots: { type: Number, required: true, default: DEFAULT_BUILDING_SLOTS },
    building: [{
        name: { type: String, default: 'Empty' },
        level: { type: Number, default: 0 }
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
PlayerSchema.static('calculateBuildingsEffect', function(document) {
    document.woodCapacity = 0;
    document.stoneCapacity = 0;
    document.metalCapacity = 0;

    document.farmHeight = DEFAULT_FARM_HEIGHT;

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
        else if (document.building[i].name === 'Extra Plots') {
            document.farmHeight += document.building[i].level;
        }
    }

    if (woodCount == 1) document.woodCapacity *= BUILDING_SYNERGY[1];
    if (woodCount == 2) document.woodCapacity *= BUILDING_SYNERGY[2];
    if (woodCount == 3) document.woodCapacity *= BUILDING_SYNERGY[3];
    if (woodCount >= 4) document.woodCapacity *= BUILDING_SYNERGY[4];

    if (stoneCount == 1) document.stoneCapacity *= BUILDING_SYNERGY[1];
    if (stoneCount == 2) document.stoneCapacity *= BUILDING_SYNERGY[2];
    if (stoneCount == 3) document.stoneCapacity *= BUILDING_SYNERGY[3];
    if (stoneCount >= 4) document.stoneCapacity *= BUILDING_SYNERGY[4];

    if (metalCount == 1) document.metalCapacity *= BUILDING_SYNERGY[1];
    if (metalCount == 2) document.metalCapacity *= BUILDING_SYNERGY[2];
    if (metalCount == 3) document.metalCapacity *= BUILDING_SYNERGY[3];
    if (metalCount >= 4) document.metalCapacity *= BUILDING_SYNERGY[4];
});

// Update lastHarvested
PlayerSchema.static('updateProduction', async function(player) {
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