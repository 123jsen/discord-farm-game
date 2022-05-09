const mongoose = require("mongoose");

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

module.exports = mongoose.model("Player", PlayerSchema);