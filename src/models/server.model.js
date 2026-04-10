const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ServerSchema = Schema({
    guildId: { type: String, required: true, unique: true },
    welcomeChannelId: { type: String, default: null },
    race: {
        active:          { type: Boolean, default: false },
        initiatorId:     { type: String,  default: null },
        startTime:       { type: Date,    default: null },
        cropsHarvested:  { type: Number,  default: 0 },
        targetCrops:     { type: Number,  default: 0 },
        cooldownUntil:   { type: Date,    default: null }
    }
});

module.exports = mongoose.model("Server", ServerSchema);