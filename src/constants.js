// Central game constants — import from here instead of hardcoding values

// ── Prestige ─────────────────────────────────────────────────────────────────
const PRESTIGE_MULTIPLIER      = 1.15;                        // income multiplier per prestige level
const PRESTIGE_INITIATION_COST = [200000, 20000, 20000, 20000]; // [money, wood, stone, metal]
const PRESTIGE_REFUND_PERCENT  = 0.3;                         // fraction refunded on race failure
const PRESTIGE_CROP_BASE       = 250;                         // crops needed for 1st prestige (doubles each time)
const PRESTIGE_VETERANS_THRESHOLD = 5;                        // prestiges needed for 'Veteran' achievement

// ── Race ──────────────────────────────────────────────────────────────────────
const RACE_DURATION_MS  = 60 * 60 * 1000; // 1 hour
const RACE_COOLDOWN_MS  = 60 * 60 * 1000; // 1 hour cooldown after failure

// ── Farm defaults ─────────────────────────────────────────────────────────────
const DEFAULT_FARM_WIDTH    = 3;
const DEFAULT_FARM_HEIGHT   = 3;
const DEFAULT_BUILDING_SLOTS = 4;

// ── Building synergy multipliers (keyed by building count) ───────────────────
const BUILDING_SYNERGY = { 1: 1.0, 2: 1.4, 3: 2.0, 4: 2.3 };

module.exports = {
    PRESTIGE_MULTIPLIER,
    PRESTIGE_INITIATION_COST,
    PRESTIGE_REFUND_PERCENT,
    PRESTIGE_CROP_BASE,
    PRESTIGE_VETERANS_THRESHOLD,
    RACE_DURATION_MS,
    RACE_COOLDOWN_MS,
    DEFAULT_FARM_WIDTH,
    DEFAULT_FARM_HEIGHT,
    DEFAULT_BUILDING_SLOTS,
    BUILDING_SYNERGY,
};
