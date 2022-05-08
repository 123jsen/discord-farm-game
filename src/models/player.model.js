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

// Expands farm/building, keeping previous elements
PlayerSchema.methods.fillEmpty = function fillEmpty() {
    const emptyFarm = Array(this.farmWidth * this.farmHeight - this.farm.length).fill({ name: 'Empty', timer: new Date });
    const emptyBuilding = Array(this.buildingSlots - this.building.length).fill({ name: 'Empty', level: 0});

    this.update({
        farm: [...this.farm, ...emptyFarm],
        building: [...this.building, ...emptyBuilding]
    })
}

// Define constant Building Width
PlayerSchema.virtual('buildingWidth').get(() => {
    return 2;
})

module.exports = mongoose.model("Player", PlayerSchema);