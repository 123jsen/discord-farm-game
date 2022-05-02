const Player = require("./models/player.model.js");

async function createPlayer(interaction) {
    const userId = interaction.user.id;
    const player = await Player.findOne({ userId }).exec();

    // No creation needed if player is already in DB
    if (player) return;

    Player.create({
        userId,
        money: 100,
        farmWidth: 3,
        farm: [],
    });

    console.log(`Created new player for ${interaction.user.username}`);
}

module.exports = createPlayer;
