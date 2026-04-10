// Prestige service — handles race initiation, resolution, and status

const { checkEnoughMoney } = require('../player.js');
const Player = require('../models/player.model.js');

const RACE_DURATION_MS   = 60 * 60 * 1000; // 1 hour
const COOLDOWN_DURATION_MS = 60 * 60 * 1000; // 1 hour cooldown after failure
const INITIATION_COST    = [500000, 100000, 100000, 100000]; // [money, wood, stone, metal]
const REFUND_PERCENT     = 0.3;
const PRESTIGE_MULTIPLIER = 1.15;

/**
 * Returns the current tier based on crops harvested.
 * Tier 1: 500, Tier 2: 2000, Tier 3: 4000, Tier 4+: +2000 each
 */
function getCurrentTier(cropsHarvested) {
    if (cropsHarvested < 500) return 0;
    if (cropsHarvested < 2000) return 1;
    return Math.floor(cropsHarvested / 2000) + 1;
}

/**
 * Returns the crop threshold needed to reach the next tier.
 */
function getNextTierThreshold(currentTier) {
    if (currentTier === 0) return 500;
    return currentTier * 2000;
}

/**
 * Initiate a prestige race. Costs resources and starts the 1-hour timer.
 * @param {object} player - Mongoose player document
 * @param {object} server - Mongoose server document
 * @returns {{ ok: boolean, message: string }}
 */
async function initiateRace(player, server) {
    // Check cooldown from a previous failed race
    if (server.race.cooldownUntil && server.race.cooldownUntil > new Date()) {
        const remaining = Math.ceil((server.race.cooldownUntil - Date.now()) / 60000);
        return { ok: false, message: `A race failed recently. The server is on cooldown for ${remaining} more minute(s).` };
    }

    // Check if a race is already active
    if (server.race.active) {
        const elapsed = Date.now() - server.race.startTime.getTime();
        if (elapsed < RACE_DURATION_MS) {
            const remaining = Math.ceil((RACE_DURATION_MS - elapsed) / 60000);
            return { ok: false, message: `A prestige race is already active! ${remaining} minute(s) remaining. Use /race to see progress.` };
        }
    }

    // Check resources
    if (!checkEnoughMoney(INITIATION_COST, player)) {
        return { ok: false, message: `You need $${INITIATION_COST[0].toLocaleString()}, ${INITIATION_COST[1].toLocaleString()} 🪵, ${INITIATION_COST[2].toLocaleString()} 🪨 and ${INITIATION_COST[3].toLocaleString()} 🔧 to initiate a prestige race.` };
    }

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
        cooldownUntil: null
    };
    await server.save();

    return { ok: true, message: `🌾 **Prestige race started!** The server has **1 hour** to collectively harvest crops.\n\n🥉 Tier 1: 500 crops\n🥈 Tier 2: 2,000 crops\n🥇 Tier 3: 4,000 crops\n💎 Tier 4+: 6,000+ crops (no limit)\n\nAt least Tier 1 must be reached for <@${player.userId}> to prestige!` };
}

/**
 * Returns the current race status as a display string.
 * @param {object} server - Mongoose server document
 * @returns {{ ok: boolean, message: string }}
 */
function getRaceStatus(server) {
    if (server.race.cooldownUntil && server.race.cooldownUntil > new Date()) {
        const remaining = Math.ceil((server.race.cooldownUntil - Date.now()) / 60000);
        return { ok: false, message: `No active race. Server is on cooldown for ${remaining} more minute(s) after a failed race.` };
    }

    if (!server.race.active) {
        return { ok: false, message: 'No prestige race is currently active. A player can start one with /prestige.' };
    }

    const elapsed = Date.now() - server.race.startTime.getTime();
    const timeRemaining = RACE_DURATION_MS - elapsed;

    if (timeRemaining <= 0) {
        return { ok: false, message: 'The race has ended. Waiting for resolution on the next action...' };
    }

    const minsRemaining = Math.ceil(timeRemaining / 60000);
    const crops = server.race.cropsHarvested;
    const tier = getCurrentTier(crops);
    const nextThreshold = getNextTierThreshold(tier);
    const tierLabel = tier === 0 ? 'None yet' : `Tier ${tier}`;

    return {
        ok: true,
        message: `🌾 **Prestige Race in Progress!**\n\nInitiated by <@${server.race.initiatorId}>\n⏱️ Time remaining: ${minsRemaining} minute(s)\n🌱 Crops harvested: ${crops}\n🏆 Current tier: ${tierLabel}\n➡️ Next tier at: ${nextThreshold} crops`
    };
}

/**
 * Checks if the active race has expired and resolves it (awards prestige or refunds + cooldown).
 * Should be called in middleware on every interaction.
 * @param {object} server - Mongoose server document
 */
async function checkAndResolveExpiredRace(server) {
    if (!server.race.active) return;

    const elapsed = Date.now() - server.race.startTime.getTime();
    if (elapsed < RACE_DURATION_MS) return;

    const tier = getCurrentTier(server.race.cropsHarvested);

    if (tier >= 1) {
        // Success — prestige the initiator
        const initiator = await Player.findOne({ userId: server.race.initiatorId });
        if (initiator) {
            initiator.prestigeCount += 1;
            await resetPlayer(initiator);
        }
    } else {
        // Failure — 30% refund and cooldown
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
            cooldownUntil: new Date(Date.now() + COOLDOWN_DURATION_MS)
        };
        await server.save();
    }
}

/**
 * Resets a player's progress back to default after prestige.
 * Preserves prestigeCount (already incremented before calling this).
 * @param {object} player - Mongoose player document
 */
async function resetPlayer(player) {
    const emptyFarm = Array(9).fill(null).map(() => ({ name: 'Empty', timer: new Date() }));
    const emptyBuilding = Array(4).fill(null).map(() => ({ name: 'Empty', level: 0 }));

    player.money          = 0;
    player.wood           = 0;
    player.stone          = 0;
    player.metal          = 0;
    player.farmWidth      = 3;
    player.farmHeight     = 3;
    player.buildingSlots  = 4;
    player.woodCapacity   = 0;
    player.stoneCapacity  = 0;
    player.metalCapacity  = 0;
    player.farm           = emptyFarm;
    player.building       = emptyBuilding;
    player.lastHarvested  = new Date();

    await player.save();
}

module.exports = {
    initiateRace,
    getRaceStatus,
    checkAndResolveExpiredRace,
    getCurrentTier,
    getNextTierThreshold,
    RACE_DURATION_MS,
    COOLDOWN_DURATION_MS,
    INITIATION_COST,
    REFUND_PERCENT,
    PRESTIGE_MULTIPLIER,
};
