const Player = require("./models/player.model.js");

async function createPlayer(interaction) {
    const userId = interaction.user.id;
    let player = await Player.findOne({ userId });

    // No creation needed if player is already in DB
    if (player) return;

    player = await Player.create({
        userId,
        money: 100,
    });

    await player.fillEmpty();

    console.log(`Created new player for ${interaction.user.username}`);
}

module.exports = createPlayer;
