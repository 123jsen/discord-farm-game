const Player = require("./models/player.model.js");
const Crop = require("./models/crop.model.js");

async function createPlayer(interaction) {
    const userId = interaction.user.id;
    const player = await Player.findOne({ userId }).exec();

    // No creation needed if player is already in DB
    if (player) return;

    // Create array of empty farm
    const emptyCrop = await Crop.findOne({ name: "Empty" }).exec();

    if (!emptyCrop) {
        console.log("Failed to find emptyCrop, has init-game.js been initialized yet?");
        return;
    }

    const emptyFarm = Array(9).fill(emptyCrop.id);
    const emptyTime = Array(9).fill(null);

    // Need to wait player creation to finish before running other commands like "/farm"
    await Player.create({
        userId,
        money: 100,
        farmWidth: 3,
        farm: emptyFarm,
        timer: emptyTime
    });

    console.log(`Created new player for ${interaction.user.username}`);
}

module.exports = createPlayer;
