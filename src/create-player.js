const Player = require("./models/player.model.js");

async function createPlayer(interaction) {
    const userId = interaction.user.id;
    let player = await Player.findOne({ userId });

    // No creation needed if player is already in DB
    if (player) return;

    // Fill Building and Farm Slots
    const emptyFarm = Array(9).fill({ name: 'Empty', timer: new Date });
    const emptyBuilding = Array(4).fill({ name: 'Empty', level: 0});

    player = await Player.create({
        userId,
        money: 100,
        building: emptyBuilding,
        farm: emptyFarm
    });

    console.log(`Created new player for ${interaction.user.username}`);
}

module.exports = createPlayer;
