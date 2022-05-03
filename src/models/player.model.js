const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PlayerSchema = Schema({
    userId: { type: String, required: true, unique: true },
    money: { type: Number, required: true },
    farmWidth: { type: Number, required: true },
    farm: [{ type: Schema.Types.ObjectId, ref: "Crop" }],
    timer: [{ type: Date }]
});

module.exports = mongoose.model("Player", PlayerSchema);