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
    farm: [{ type: String }],
    timer: [{ type: Date, default: null }],

    // Building Detail
    building: [{ type: String }]
});

module.exports = mongoose.model("Player", PlayerSchema);