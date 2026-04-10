// Farm service — handles plant, plantAll, harvest, checkCrop logic

/**
 * Plant a crop at a specific position.
 * @param {object} player   - Mongoose player document
 * @param {number} row      - 0-indexed row
 * @param {number} col      - 0-indexed col
 * @param {string} seedName - crop name string
 * @param {Array}  cropList - from data/crops/export.js
 * @returns {{ ok: boolean, message: string }}
 */
async function plant(player, row, col, seedName, cropList) {
    if (row >= player.farmHeight || col >= player.farmWidth) {
        return { ok: false, message: 'Coordinates are out of bound' };
    }

    const newCrop = cropList.find(crop => crop.name === seedName);

    if (player.money < newCrop.cost) {
        return { ok: false, message: `You don't have enough money. (You need $${newCrop.cost} and you have $${player.money})` };
    }

    const index = row * player.farmWidth + col;

    if (player.farm[index].name !== 'Empty') {
        return { ok: false, message: 'Farmland is not empty' };
    }

    player.farm[index] = { name: newCrop.name, timer: new Date() };
    player.money -= newCrop.cost;
    await player.save();

    return { ok: true, message: `Spent $${newCrop.cost} and planted ${newCrop.name}` };
}

/**
 * Plant a crop in all available empty plots until money runs out.
 * @param {object} player    - Mongoose player document
 * @param {string} seedName  - crop name string
 * @param {Array}  cropList  - from data/crops/export.js
 * @returns {{ ok: boolean, message: string }}
 */
async function plantAll(player, seedName, cropList) {
    const newCrop = cropList.find(crop => crop.name === seedName);

    if (!newCrop) {
        return { ok: false, message: 'Crop not found' };
    }

    let cropPlanted = 0;
    let occupiedField = 0;

    for (let index = 0; index < player.farmArea; index++) {
        if (player.farm[index].name !== 'Empty') {
            occupiedField++;
            continue;
        }

        if (player.money >= newCrop.cost) {
            player.farm[index] = { name: newCrop.name, timer: new Date() };
            cropPlanted++;
            player.money -= newCrop.cost;
        }
    }

    if (cropPlanted === 0) {
        if (occupiedField === player.farmArea)
            return { ok: false, message: 'No crops are planted. The farm is full' };
        return { ok: false, message: `No crops are planted. You have $${player.money}` };
    }

    await player.save();

    return { ok: true, message: `Spent $${cropPlanted * newCrop.cost} and planted ${cropPlanted} ${newCrop.name} in total` };
}

/**
 * Harvest all mature crops.
 * @param {object} player   - Mongoose player document
 * @param {Array}  cropList - from data/crops/export.js
 * @param {object} [server] - Mongoose server document (optional, for race tracking)
 * @returns {{ ok: boolean, message: string }}
 */
async function harvest(player, cropList, server = null) {
    const current = Date.now();
    let harvestGain = 0;
    let cropCount = 0;
    const multiplier = Math.pow(1.15, player.prestigeCount || 0);

    for (let index = 0; index < player.farmArea; index++) {
        if (player.farm[index].name === 'Empty') continue;

        const { worth, growthTime } = cropList.find(crop => crop.name === player.farm[index].name);

        if (player.farm[index].timer.getTime() + growthTime < current) {
            player.farm[index] = { name: 'Empty', timer: new Date() };
            harvestGain += Math.round(worth * multiplier);
            cropCount++;
        }
    }

    if (harvestGain === 0) {
        return { ok: false, message: 'Nothing was harvested' };
    }

    player.money += harvestGain;
    await player.save();

    // Contribute to active race if one is running
    if (server && server.race && server.race.active) {
        server.race.cropsHarvested += cropCount;
        await server.save();
    }

    return { ok: true, message: `Harvested $${harvestGain}!` };
}

/**
 * Check the maturity progress of a crop at a position.
 * @param {object} player   - Mongoose player document
 * @param {number} row      - 0-indexed row
 * @param {number} col      - 0-indexed col
 * @param {Array}  cropList - from data/crops/export.js
 * @returns {{ ok: boolean, message: string }}
 */
function checkCrop(player, row, col, cropList) {
    if (row >= player.farmHeight || col >= player.farmWidth) {
        return { ok: false, message: 'Coordinates are out of bound' };
    }

    const index = row * player.farmWidth + col;

    if (player.farm[index].name === 'Empty') {
        return { ok: false, message: 'No crop is planted at that spot' };
    }

    const crop = cropList.find(c => c.name === player.farm[index].name);
    const timeRemaining = ((player.farm[index].timer.getTime() + crop.growthTime) - Date.now()) / 1000;

    if (timeRemaining < 0) {
        return { ok: false, message: 'Crop is ready for harvest' };
    }

    if (timeRemaining > 60) {
        const mins = Math.floor(timeRemaining / 60);
        const secs = Math.round(timeRemaining - mins * 60);
        return { ok: false, message: `${player.farm[index].name} will be mature in ${mins} minutes and ${secs} seconds` };
    }

    return { ok: false, message: `${player.farm[index].name} will be mature in ${Math.round(timeRemaining)} seconds` };
}

module.exports = { plant, plantAll, harvest, checkCrop };
