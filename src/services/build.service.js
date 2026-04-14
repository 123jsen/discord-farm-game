// Build service — handles build, destroy, checkBuild logic

const { checkEnoughMoney } = require('../player.js');
const { tryUnlock, formatUnlocked } = require('./achievement.service.js');

/**
 * Build a new building or upgrade an existing one at a slot.
 * @param {object} player        - Mongoose player document
 * @param {number} row           - 0-indexed row
 * @param {number} col           - 0-indexed col
 * @param {string} buildTarget   - building target string e.g. 'wood', 'farmHeight'
 * @param {Array}  buildingsList - from data/buildings/export.js
 * @param {object} PlayerModel   - Mongoose Player model (for calculateBuildingsEffect)
 * @returns {{ ok: boolean, message: string }}
 */
async function build(player, row, col, buildTarget, buildingsList, PlayerModel) {
    const index = row * player.buildingWidth + col;

    if (col >= player.buildingWidth || index >= player.buildingSlots) {
        return { ok: false, message: 'Coordinates are out of bound' };
    }

    const category = buildingsList.find(b => b.target === buildTarget);
    const currentBuilding = player.building[index];

    // New build on empty slot
    if (currentBuilding.name === 'Empty') {
        const buildLevel = category.levels[0];

        if (!checkEnoughMoney(buildLevel.cost, player)) {
            return { ok: false, message: `You need $${buildLevel.cost[0]}, ${buildLevel.cost[1]} wood, ${buildLevel.cost[2]} stone and ${buildLevel.cost[3]} metal to build ${category.name}` };
        }

        if (buildTarget === 'farmHeight') {
            const extraFarm = Array(player.farmWidth).fill(null).map(() => ({ name: 'Empty', timer: new Date() }));
            player.farm.push(...extraFarm);
        }

        player.building[index] = { name: category.name, level: 1 };
        player.money -= buildLevel.cost[0];
        player.wood -= buildLevel.cost[1];
        player.stone -= buildLevel.cost[2];
        player.metal -= buildLevel.cost[3];

        PlayerModel.calculateBuildingsEffect(player);

        const newBuildAchievements = [];
        newBuildAchievements.push(...[tryUnlock(player, 'Builder')].filter(Boolean));
        const filledSlots = player.building.slice(0, player.buildingSlots).filter(b => b.name !== 'Empty').length;
        if (filledSlots === player.buildingSlots)   newBuildAchievements.push(...[tryUnlock(player, 'Architect')].filter(Boolean));
        const nameCounts = {};
        player.building.slice(0, player.buildingSlots).forEach(b => { if (b.name !== 'Empty') nameCounts[b.name] = (nameCounts[b.name] || 0) + 1; });
        if (Object.values(nameCounts).some(c => c >= 3)) newBuildAchievements.push(...[tryUnlock(player, 'Specialist')].filter(Boolean));

        await player.save();

        return { ok: true, message: `Spent $${buildLevel.cost[0]}, ${buildLevel.cost[1]} wood, ${buildLevel.cost[2]} stone and ${buildLevel.cost[3]} metal to build ${category.name}` + formatUnlocked(newBuildAchievements) };
    }

    // Upgrade existing building
    if (currentBuilding.name !== category.name) {
        return { ok: false, message: `You cannot build ${category.name} as ${currentBuilding.name} is already here` };
    }

    const nextTier = category.levels[currentBuilding.level];

    if (!nextTier) {
        return { ok: false, message: `You cannot upgrade ${category.name}` };
    }

    if (!checkEnoughMoney(nextTier.cost, player)) {
        return { ok: false, message: `You need $${nextTier.cost[0]}, ${nextTier.cost[1]} wood, ${nextTier.cost[2]} stone and ${nextTier.cost[3]} metal to upgrade ${category.name} to level ${currentBuilding.level + 1}` };
    }

    if (buildTarget === 'farmHeight') {
        const extraFarm = Array(player.farmWidth).fill(null).map(() => ({ name: 'Empty', timer: new Date() }));
        player.farm.push(...extraFarm);
    }

    player.building[index] = { name: category.name, level: currentBuilding.level + 1 };
    player.money -= nextTier.cost[0];
    player.wood -= nextTier.cost[1];
    player.stone -= nextTier.cost[2];
    player.metal -= nextTier.cost[3];

    PlayerModel.calculateBuildingsEffect(player);

    const newUpgradeAchievements = [];
    const filledSlotsUpg = player.building.slice(0, player.buildingSlots).filter(b => b.name !== 'Empty').length;
    if (filledSlotsUpg === player.buildingSlots) newUpgradeAchievements.push(...[tryUnlock(player, 'Architect')].filter(Boolean));
    const nameCountsUpg = {};
    player.building.slice(0, player.buildingSlots).forEach(b => { if (b.name !== 'Empty') nameCountsUpg[b.name] = (nameCountsUpg[b.name] || 0) + 1; });
    if (Object.values(nameCountsUpg).some(c => c >= 3)) newUpgradeAchievements.push(...[tryUnlock(player, 'Specialist')].filter(Boolean));

    await player.save();

    return { ok: true, message: `You spent $${nextTier.cost[0]}, ${nextTier.cost[1]} wood, ${nextTier.cost[2]} stone and ${nextTier.cost[3]} metal to upgrade ${category.name} to level ${currentBuilding.level + 1}` + formatUnlocked(newUpgradeAchievements) };
}

/**
 * Destroy a building and refund a percentage of its cost.
 * @param {object} player        - Mongoose player document
 * @param {number} row           - 0-indexed row
 * @param {number} col           - 0-indexed col
 * @param {Array}  buildingsList - from data/buildings/export.js
 * @param {number} refundPercent - from data/config.json
 * @param {object} PlayerModel   - Mongoose Player model (for calculateBuildingsEffect)
 * @returns {{ ok: boolean, message: string }}
 */
async function destroy(player, row, col, buildingsList, refundPercent, PlayerModel) {
    const index = row * player.buildingWidth + col;

    if (col >= player.buildingWidth || index >= player.buildingSlots) {
        return { ok: false, message: 'Coordinates are out of bound' };
    }

    const buildingName = player.building[index].name;

    if (buildingName === 'Empty') {
        return { ok: false, message: 'Building is empty' };
    }

    const category = buildingsList.find(b => b.name === buildingName);
    const buildingStats = category.levels[player.building[index].level - 1];

    player.money += buildingStats.cost[0] * refundPercent;
    player.wood += buildingStats.cost[1] * refundPercent;
    player.stone += buildingStats.cost[2] * refundPercent;
    player.metal += buildingStats.cost[3] * refundPercent;

    player.building[index] = { name: 'Empty', level: 0 };

    PlayerModel.calculateBuildingsEffect(player);
    await player.save();

    return { ok: true, message: `${buildingName} is destroyed` };
}

/**
 * Check what building is at a slot.
 * @param {object} player - Mongoose player document
 * @param {number} row    - 0-indexed row
 * @param {number} col    - 0-indexed col
 * @returns {{ ok: boolean, message: string }}
 */
function checkBuild(player, row, col) {
    const index = row * player.buildingWidth + col;

    if (col >= player.buildingWidth || index >= player.buildingSlots) {
        return { ok: false, message: 'Coordinates are out of bound' };
    }

    const current = player.building[index];

    if (current.name === 'Empty') {
        return { ok: false, message: 'Building plot is empty' };
    }

    return { ok: false, message: `Level ${current.level} ${current.name} is built here` };
}

/**
 * Return all building slots grouped by building type, with level info.
 * @param {object} player        - Mongoose player document
 * @param {Array}  buildingsList - from data/buildings/export.js
 * @returns {Array} groups - [{ name, image, maxLevel, slots: [{ row, col, level, effect }] }]
 */
function checkAllBuildings(player, buildingsList) {
    const map = {};

    for (let i = 0; i < player.buildingSlots; i++) {
        const slot = player.building[i];
        if (slot.name === 'Empty') continue;

        const category = buildingsList.find(b => b.name === slot.name);
        if (!map[slot.name]) {
            map[slot.name] = {
                name: slot.name,
                image: category.image,
                maxLevel: category.levels.length,
                slots: [],
            };
        }

        const row = Math.floor(i / player.buildingWidth) + 1;
        const col = (i % player.buildingWidth) + 1;
        const effect = category.levels[slot.level - 1]?.effect ?? null;
        map[slot.name].slots.push({ row, col, level: slot.level, effect });
    }

    return Object.values(map);
}

module.exports = { build, destroy, checkBuild, checkAllBuildings };
