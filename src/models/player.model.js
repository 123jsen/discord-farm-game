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

    // Plot Detail
    farmWidth: { type: Number, required: true, default: 3 },
    farm: [{ type: String, default: 'Empty' }],
    timer: [{ type: Date, default: null }],

    // Building Detail
    building: [{ 
        name: {type: String, default: 'Empty'},
        level: {type: String, default: 0}
    }]
});

module.exports = mongoose.model("Player", PlayerSchema);