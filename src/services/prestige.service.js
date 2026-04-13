// Prestige service — handles race initiation, resolution, and status

const { checkEnoughMoney } = require('../player.js');
const Player = require('../models/player.model.js');
const { DEFAULT_MONEY } = require('../../data/config.json');
const { tryUnlock } = require('./achievement.service.js');

const RACE_DURATION_MS    = 60 * 60 * 1000; // 1 hour
const COOLDOWN_DURATION_MS = 60 * 60 * 1000; // 1 hour cooldown after failure
const INITIATION_COST     = [200000, 20000, 20000, 20000]; // [money, wood, stone, metal]
const REFUND_PERCENT      = 0.3;
const PRESTIGE_MULTIPLIER = 1.15;

/**
 * Returns the crops needed to prestige based on current prestige count.
 * 1st prestige: 250, 2nd: 500, 3rd: 1000, 4th: 2000 ... (doubles each time)
 */
function getTargetCrops(prestigeCount) {
    return 250 * Math.pow(2, prestigeCount);
}

/**
 * Initiate a prestige race. Costs resources and starts the 1-hour timer.
 */
async function initiateRace(player, server) {
    if (server.race.cooldownUntil && server.race.cooldownUntil > new Date()) {
        const remaining = Math.ceil((server.race.cooldownUntil - Date.now()) / 60000);
        return { ok: false, message: `A race failed recently. The server is on cooldown for ${remaining} more minute(s).` };
    }

    if (server.race.active) {
        const elapsed = Date.now() - server.race.startTime.getTime();
        if (elapsed < RACE_DURATION_MS) {
            const remaining = Math.ceil((RACE_DURATION_MS - elapsed) / 60000);
            return { ok: false, message: `A prestige race is already active! ${remaining} minute(s) remaining. Use /race to see progress.` };
        }
    }

    if (!checkEnoughMoney(INITIATION_COST, player)) {
        return { ok: false, message: `You need $${INITIATION_COST[0].toLocaleString()}, ${INITIATION_COST[1].toLocaleString()} 🪵, ${INITIATION_COST[2].toLocaleString()} 🪨 and ${INITIATION_COST[3].toLocaleString()} 🔧 to initiate a prestige race.` };
    }

    const targetCrops = getTargetCrops(player.prestigeCount);

    player.money -= INITIATION_COST[0];
    player.wood  -= INITIATION_COST[1];
    player.stone -= INITIATION_COST[2];
    player.metal -= INITIATION_COST[3];
    await player.save();

    server.race = {
        active: true,
        initiatorId: player.userId,
        startTime: new Date(),
        cropsHarvested: 0,
        targetCrops,
        cooldownUntil: null
    };
    await server.save();

    return { ok: true, message: `🌾 **Prestige race started!** The server has **1 hour** to collectively harvest **${targetCrops} crops**.\n\nThis is <@${player.userId}>'s prestige #${player.prestigeCount + 1}. Harvest together to complete it early!` };
}

/**
 * Awards prestige to the initiator and clears the race.
 * Called on success (target reached or timer expired with enough crops).
 */
async function resolveRaceSuccess(server) {
    const initiator = await Player.findOne({ userId: server.race.initiatorId });
    if (initiator) {
        initiator.prestigeCount += 1;
        tryUnlock(initiator, 'The Reset');
        if (initiator.prestigeCount >= 5) tryUnlock(initiator, 'Veteran');
        await resetPlayer(initiator);
    }

    server.race = {
        active: false,
        initiatorId: null,
        startTime: null,
        cropsHarvested: 0,
        targetCrops: 0,
        cooldownUntil: null
    };
    await server.save();
}

/**
 * Refunds 30% of initiation cost and sets cooldown. Clears the race.
 * Called on failure (timer expired, target not reached).
 */
async function resolveRaceFailure(server) {
    const initiator = await Player.findOne({ userId: server.race.initiatorId });
    if (initiator) {
        initiator.money  += INITIATION_COST[0] * REFUND_PERCENT;
        initiator.wood   += INITIATION_COST[1] * REFUND_PERCENT;
        initiator.stone  += INITIATION_COST[2] * REFUND_PERCENT;
        initiator.metal  += INITIATION_COST[3] * REFUND_PERCENT;
        await initiator.save();
    }

    server.race = {
        active: false,
        initiatorId: null,
        startTime: null,
        cropsHarvested: 0,
        targetCrops: 0,
        cooldownUntil: new Date(Date.now() + COOLDOWN_DURATION_MS)
    };
    await server.save();
}

/**
 * Checks if the active race has expired and resolves it.
 * Called from middleware on every interaction.
 */
async function checkAndResolveExpiredRace(server) {
    if (!server.race.active) return;

    const elapsed = Date.now() - server.race.startTime.getTime();
    if (elapsed < RACE_DURATION_MS) return;

    if (server.race.cropsHarvested >= server.race.targetCrops) {
        await resolveRaceSuccess(server);
    } else {
        await resolveRaceFailure(server);
    }
}

/**
 * Returns the current race status as a display string.
 */
function getRaceStatus(server) {
    if (server.race.cooldownUntil && server.race.cooldownUntil > new Date()) {
        const remaining = Math.ceil((server.race.cooldownUntil - Date.now()) / 60000);
        return { ok: false, message: `No active race. Server is on cooldown for **${remaining}** more minute(s) after a failed race.` };
    }

    if (!server.race.active) {
        return { ok: false, message: 'No prestige race is currently active. A player can start one with /prestige.' };
    }

    const elapsed = Date.now() - server.race.startTime.getTime();
    const timeRemaining = Math.max(0, RACE_DURATION_MS - elapsed);
    const minsRemaining = Math.ceil(timeRemaining / 60000);
    const crops = server.race.cropsHarvested;
    const target = server.race.targetCrops;
    const percent = Math.min(100, Math.floor((crops / target) * 100));

    return {
        ok: true,
        message: `🌾 **Prestige Race in Progress!**\n\nInitiated by <@${server.race.initiatorId}>\n⏱️ Time remaining: **${minsRemaining}** minute(s)\n🌱 Progress: **${crops} / ${target} crops** (${percent}%)`
    };
}

/**
 * Resets a player's progress back to default after prestige.
 * prestigeCount must already be incremented before calling.
 */
async function resetPlayer(player) {
    const emptyFarm     = Array(9).fill(null).map(() => ({ name: 'Empty', timer: new Date() }));
    const emptyBuilding = Array(4).fill(null).map(() => ({ name: 'Empty', level: 0 }));

    player.money         = DEFAULT_MONEY;
    player.wood          = 0;
    player.stone         = 0;
    player.metal         = 0;
    player.farmWidth     = 3;
    player.farmHeight    = 3;
    player.buildingSlots = 4;
    player.woodCapacity  = 0;
    player.stoneCapacity = 0;
    player.metalCapacity = 0;
    player.farm          = emptyFarm;
    player.building      = emptyBuilding;
    player.lastHarvested = new Date();

    await player.save();
}

module.exports = {
    initiateRace,
    getRaceStatus,
    checkAndResolveExpiredRace,
    resolveRaceSuccess,
    getTargetCrops,
    RACE_DURATION_MS,
    COOLDOWN_DURATION_MS,
    INITIATION_COST,
    REFUND_PERCENT,
    PRESTIGE_MULTIPLIER,
};
