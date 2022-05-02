const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CropSchema = Schema({
    name: { type: String, required: true, unique: true },
    image: { type: String },
    cost: { type: Number, required: true },
    worth: { type: Number, required: true }
});

module.exports = mongoose.model("Crop", CropSchema);