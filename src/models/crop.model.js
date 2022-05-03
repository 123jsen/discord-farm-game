const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Timer is in seconds
const CropSchema = Schema({
    name: { type: String, required: true, unique: true },
    image: { type: String },
    cost: { type: Number, required: true },
    worth: { type: Number, required: true },
    growthTime: { type: Number, required: true }
});

module.exports = mongoose.model("Crop", CropSchema);