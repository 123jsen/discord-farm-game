const {
    initiateRace,
    getRaceStatus,
    checkAndResolveExpiredRace,
    getCurrentTier,
    getNextTierThreshold,
    RACE_DURATION_MS,
    COOLDOWN_DURATION_MS,
    INITIATION_COST,
    REFUND_PERCENT,
} = require('../../src/services/prestige.service.js');
const { makePlayer } = require('../helpers.js');

// Mock Player model used inside prestige service
jest.mock('../../src/models/player.model.js', () => ({
    findOne: jest.fn(),
}));

const Player = require('../../src/models/player.model.js');

function makeServer(overrides = {}) {
    return {
        race: {
            active: false,
            initiatorId: null,
            startTime: null,
            cropsHarvested: 0,
            cooldownUntil: null,
            ...overrides.race
        },
        save: jest.fn().mockResolvedValue(true),
        ...overrides
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── getCurrentTier ───────────────────────────────────────────────────────────

describe('getCurrentTier', () => {
    test('tier 0 below 500', () => expect(getCurrentTier(499)).toBe(0));
    test('tier 1 at 500',    () => expect(getCurrentTier(500)).toBe(1));
    test('tier 1 at 1999',   () => expect(getCurrentTier(1999)).toBe(1));
    test('tier 2 at 2000',   () => expect(getCurrentTier(2000)).toBe(2));
    test('tier 3 at 4000',   () => expect(getCurrentTier(4000)).toBe(3));
    test('tier 4 at 6000',   () => expect(getCurrentTier(6000)).toBe(4));
    test('tier 5 at 8000',   () => expect(getCurrentTier(8000)).toBe(5));
});

// ─── getNextTierThreshold ─────────────────────────────────────────────────────

describe('getNextTierThreshold', () => {
    test('tier 0 → 500',  () => expect(getNextTierThreshold(0)).toBe(500));
    test('tier 1 → 2000', () => expect(getNextTierThreshold(1)).toBe(2000));
    test('tier 2 → 4000', () => expect(getNextTierThreshold(2)).toBe(4000));
    test('tier 3 → 6000', () => expect(getNextTierThreshold(3)).toBe(6000));
    test('tier 4 → 8000', () => expect(getNextTierThreshold(4)).toBe(8000));
});

// ─── initiateRace ─────────────────────────────────────────────────────────────

describe('initiateRace', () => {
    test('returns error when server is on cooldown', async () => {
        const player = makePlayer({ money: 9999999, wood: 9999999, stone: 9999999, metal: 9999999, userId: 'u1' });
        const server = makeServer({ race: { cooldownUntil: new Date(Date.now() + 30 * 60000) } });
        const result = await initiateRace(player, server);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/cooldown/i);
    });

    test('returns error when a race is already active', async () => {
        const player = makePlayer({ money: 9999999, wood: 9999999, stone: 9999999, metal: 9999999, userId: 'u1' });
        const server = makeServer({ race: { active: true, startTime: new Date(), cropsHarvested: 0, cooldownUntil: null } });
        const result = await initiateRace(player, server);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/already active/i);
    });

    test('returns error when player cannot afford initiation', async () => {
        const player = makePlayer({ money: 0, wood: 0, stone: 0, metal: 0, userId: 'u1' });
        const server = makeServer();
        const result = await initiateRace(player, server);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/you need/i);
    });

    test('deducts resources and activates race on success', async () => {
        const player = makePlayer({ money: 9999999, wood: 9999999, stone: 9999999, metal: 9999999, userId: 'u1' });
        const server = makeServer();
        const result = await initiateRace(player, server);
        expect(result.ok).toBe(true);
        expect(player.money).toBe(9999999 - INITIATION_COST[0]);
        expect(player.wood).toBe(9999999 - INITIATION_COST[1]);
        expect(server.race.active).toBe(true);
        expect(server.race.initiatorId).toBe('u1');
        expect(server.race.cropsHarvested).toBe(0);
        expect(player.save).toHaveBeenCalledTimes(1);
        expect(server.save).toHaveBeenCalledTimes(1);
    });
});

// ─── getRaceStatus ────────────────────────────────────────────────────────────

describe('getRaceStatus', () => {
    test('returns no-race message when inactive', () => {
        const server = makeServer();
        const result = getRaceStatus(server);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/no prestige race/i);
    });

    test('returns cooldown message when on cooldown', () => {
        const server = makeServer({ race: { cooldownUntil: new Date(Date.now() + 30 * 60000) } });
        const result = getRaceStatus(server);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/cooldown/i);
    });

    test('returns progress info when race is active', () => {
        const server = makeServer({ race: {
            active: true,
            initiatorId: 'u1',
            startTime: new Date(Date.now() - 5 * 60000), // 5 mins ago
            cropsHarvested: 750,
            cooldownUntil: null
        }});
        const result = getRaceStatus(server);
        expect(result.ok).toBe(true);
        expect(result.message).toContain('750');
        expect(result.message).toContain('Tier 1');
    });
});

// ─── checkAndResolveExpiredRace ───────────────────────────────────────────────

describe('checkAndResolveExpiredRace', () => {
    test('does nothing when race is not active', async () => {
        const server = makeServer();
        await checkAndResolveExpiredRace(server);
        expect(server.save).not.toHaveBeenCalled();
    });

    test('does nothing when race is active but not expired', async () => {
        const server = makeServer({ race: {
            active: true,
            initiatorId: 'u1',
            startTime: new Date(), // just started
            cropsHarvested: 0,
            cooldownUntil: null
        }});
        await checkAndResolveExpiredRace(server);
        expect(server.save).not.toHaveBeenCalled();
    });

    test('on expired race with tier 0: refunds 30% and sets cooldown', async () => {
        const initiator = makePlayer({ money: 0, wood: 0, stone: 0, metal: 0, userId: 'u1' });
        Player.findOne.mockResolvedValue(initiator);

        const server = makeServer({ race: {
            active: true,
            initiatorId: 'u1',
            startTime: new Date(Date.now() - RACE_DURATION_MS - 1000), // expired
            cropsHarvested: 100, // tier 0
            cooldownUntil: null
        }});

        await checkAndResolveExpiredRace(server);

        expect(initiator.money).toBeCloseTo(INITIATION_COST[0] * REFUND_PERCENT);
        expect(initiator.wood).toBeCloseTo(INITIATION_COST[1] * REFUND_PERCENT);
        expect(initiator.save).toHaveBeenCalledTimes(1);
        expect(server.race.active).toBe(false);
        expect(server.race.cooldownUntil).not.toBeNull();
        expect(server.save).toHaveBeenCalledTimes(1);
    });

    test('on expired race with tier 1+: increments prestigeCount and resets player', async () => {
        const initiator = makePlayer({
            money: 500000, wood: 50000, stone: 50000, metal: 50000,
            farmWidth: 5, farmHeight: 5, farmArea: 25, buildingSlots: 6,
            prestigeCount: 0, userId: 'u1'
        });
        initiator.farm = Array(25).fill(null).map(() => ({ name: 'Carrot', timer: new Date() }));
        initiator.building = Array(6).fill(null).map(() => ({ name: 'Lumber Mill', level: 1 }));
        Player.findOne.mockResolvedValue(initiator);

        const server = makeServer({ race: {
            active: true,
            initiatorId: 'u1',
            startTime: new Date(Date.now() - RACE_DURATION_MS - 1000), // expired
            cropsHarvested: 600, // tier 1 reached
            cooldownUntil: null
        }});

        await checkAndResolveExpiredRace(server);

        // Player should be reset
        expect(initiator.prestigeCount).toBe(1);
        expect(initiator.money).toBe(0);
        expect(initiator.wood).toBe(0);
        expect(initiator.farmWidth).toBe(3);
        expect(initiator.farmHeight).toBe(3);
        expect(initiator.buildingSlots).toBe(4);
        expect(initiator.farm.length).toBe(9);
        expect(initiator.farm[0].name).toBe('Empty');
        expect(initiator.building.length).toBe(4);
        expect(initiator.building[0].name).toBe('Empty');
        expect(initiator.save).toHaveBeenCalledTimes(1);
    });
});
