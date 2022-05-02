// Initialize crops list

const Crop = require("./models/crop.model.js");

Crop.create({
    name: "Empty",
    image: "🟫",
    cost: "0",
    worth: "0"
})

Crop.create({
    name: "Carrot",
    image: "🥕",
    cost: "8",
    worth: "14"
});