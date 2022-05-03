// Initialize crops list

const Crop = require("./models/crop.model.js");

const mongoose = require("mongoose");
require('dotenv').config();

const dbUri = process.env.MONGODB_URI;
mongoose.connect(dbUri);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection to mongodb error"));

db.once("open", async () => {
    console.log("Connection to mongoDB server Success");

    await Crop.deleteMany({});
    console.log("Deleted all crops");

    await Crop.create({
        name: "Empty",
        image: "🟫",
        cost: "0",
        worth: "0"
    });
    console.log("Added empty crop");

    await Crop.create({
        name: "Carrot",
        image: "🥕",
        cost: "8",
        worth: "14"
    });
    console.log("Added carrot crop");

    return;
});
