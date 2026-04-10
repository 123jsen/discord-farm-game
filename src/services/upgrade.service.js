// Upgrade service — handles farm width, building slots upgrades

const { checkEnoughMoney } = require('../player.js');
const { tryUnlock, formatUnlocked } = require('./achievement.service.js');

/**
 * Upgrade a farm or tool stat.
 * @param {object} player        - Mongoose player document
 * @param {string} upgradeTarget - e.g. 'farmWidth', 'buildingSlots'
 * @param {Array}  upgradesList  - from data/upgrades/export.js
 * @returns {{ ok: boolean, message: string }}
 */
async function upgrade(player, upgradeTarget, upgradesList) {
    const category = upgradesList.find(u => u.target === upgradeTarget);
    const nextTier = category.levels.find(item => item.level === (player[upgradeTarget] + 1));

    if (!nextTier) {
        return { ok: false, message: 'There is no next tier' };
    }

    if (!checkEnoughMoney(nextTier.cost, player)) {
        return { ok: false, message: `You need $${nextTier.cost[0]}, ${nextTier.cost[1]} wood, ${nextTier.cost[2]} stone and ${nextTier.cost[3]} metal to upgrade ${category.name} to tier ${nextTier.level}` };
    }

    player.money -= nextTier.cost[0];
    player.wood -= nextTier.cost[1];
    player.stone -= nextTier.cost[2];
    player.metal -= nextTier.cost[3];

    if (upgradeTarget === 'farmWidth') {
        player.farmWidth++;
        const extraFarm = Array(player.farmHeight).fill(null).map(() => ({ name: 'Empty', timer: new Date() }));
        player.farm.push(...extraFarm);
    }

    if (upgradeTarget === 'buildingSlots') {
        player.building.push({ name: 'Empty', level: 0 });
        player.buildingSlots++;
    }

    const newAchievements = [];
    if (upgradeTarget === 'farmWidth' && player.farmWidth === 7) {
        newAchievements.push(...[tryUnlock(player, 'Full Farm')].filter(Boolean));
    }

    await player.save();

    return { ok: true, message: `Spent $${nextTier.cost[0]}, ${nextTier.cost[1]} wood, ${nextTier.cost[2]} stone and ${nextTier.cost[3]} metal to upgrade ${category.name} to tier ${nextTier.level}` + formatUnlocked(newAchievements) };
}

module.exports = { upgrade };
