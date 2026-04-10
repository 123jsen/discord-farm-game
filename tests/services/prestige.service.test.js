const {
    initiateRace,
    getRaceStatus,
    checkAndResolveExpiredRace,
    resolveRaceSuccess,
    getTargetCrops,
    RACE_DURATION_MS,
    COOLDOWN_DURATION_MS,
    INITIATION_COST,
    REFUND_PERCENT,
} = require('../../src/services/prestige.service.js');
const { makePlayer } = require('../helpers.js');

jest.mock('../../src/models/player.model.js', () => ({
    findOne: jest.fn(),
}));

const Player = require('../../src/models/player.model.js');

function makeServer(raceOverrides = {}) {
    return {
        race: {
            active: false,
            initiatorId: null,
            startTime: null,
            cropsHarvested: 0,
            targetCrops: 0,
            cooldownUntil: null,
            ...raceOverrides
        },
        save: jest.fn().mockResolvedValue(true),
    };
}

beforeEach(() => jest.clearAllMocks());

// ─── getTargetCrops ───────────────────────────────────────────────────────────

describe('getTargetCrops', () => {
    test('prestige 0 → 250',  () => expect(getTargetCrops(0)).toBe(250));
    test('prestige 1 → 500',  () => expect(getTargetCrops(1)).toBe(500));
    test('prestige 2 → 1000', () => expect(getTargetCrops(2)).toBe(1000));
    test('prestige 3 → 2000', () => expect(getTargetCrops(3)).toBe(2000));
    test('prestige 4 → 4000', () => expect(getTargetCrops(4)).toBe(4000));
});

// ─── initiateRace ─────────────────────────────────────────────────────────────

describe('initiateRace', () => {
    test('returns error when server is on cooldown', async () => {
        const player = makePlayer({ money: 9999999, wood: 9999999, stone: 9999999, metal: 9999999, userId: 'u1', prestigeCount: 0 });
        const server = makeServer({ cooldownUntil: new Date(Date.now() + 30 * 60000) });
        const result = await initiateRace(player, server);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/cooldown/i);
    });

    test('returns error when race is already active', async () => {
        const player = makePlayer({ money: 9999999, wood: 9999999, stone: 9999999, metal: 9999999, userId: 'u1', prestigeCount: 0 });
        const server = makeServer({ active: true, startTime: new Date(), targetCrops: 250 });
        const result = await initiateRace(player, server);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/already active/i);
    });

    test('returns error when player cannot afford initiation', async () => {
        const player = makePlayer({ money: 0, wood: 0, stone: 0, metal: 0, userId: 'u1', prestigeCount: 0 });
        const server = makeServer();
        const result = await initiateRace(player, server);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/you need/i);
    });

    test('sets targetCrops based on initiator prestige count', async () => {
        const player = makePlayer({ money: 9999999, wood: 9999999, stone: 9999999, metal: 9999999, userId: 'u1', prestigeCount: 2 });
        const server = makeServer();
        await initiateRace(player, server);
        expect(server.race.targetCrops).toBe(1000); // 250 * 2^2
    });

    test('deducts resources and activates race', async () => {
        const player = makePlayer({ money: 9999999, wood: 9999999, stone: 9999999, metal: 9999999, userId: 'u1', prestigeCount: 0 });
        const server = makeServer();
        const result = await initiateRace(player, server);
        expect(result.ok).toBe(true);
        expect(player.money).toBe(9999999 - INITIATION_COST[0]);
        expect(server.race.active).toBe(true);
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
        const server = makeServer({ cooldownUntil: new Date(Date.now() + 30 * 60000) });
        const result = getRaceStatus(server);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/cooldown/i);
    });

    test('shows progress and target when race is active', () => {
        const server = makeServer({
            active: true,
            initiatorId: 'u1',
            startTime: new Date(Date.now() - 5 * 60000),
            cropsHarvested: 120,
            targetCrops: 250,
        });
        const result = getRaceStatus(server);
        expect(result.ok).toBe(true);
        expect(result.message).toContain('120');
        expect(result.message).toContain('250');
    });
});

// ─── checkAndResolveExpiredRace ───────────────────────────────────────────────

describe('checkAndResolveExpiredRace', () => {
    test('does nothing when race is not active', async () => {
        const server = makeServer();
        await checkAndResolveExpiredRace(server);
        expect(server.save).not.toHaveBeenCalled();
    });

    test('does nothing when race has not yet expired', async () => {
        const server = makeServer({ active: true, startTime: new Date(), targetCrops: 250 });
        await checkAndResolveExpiredRace(server);
        expect(server.save).not.toHaveBeenCalled();
    });

    test('on expired race with target not reached: refunds 30% and sets cooldown', async () => {
        const initiator = makePlayer({ money: 0, wood: 0, stone: 0, metal: 0, userId: 'u1' });
        Player.findOne.mockResolvedValue(initiator);
        const server = makeServer({
            active: true,
            initiatorId: 'u1',
            startTime: new Date(Date.now() - RACE_DURATION_MS - 1000),
            cropsHarvested: 50,
            targetCrops: 250,
        });

        await checkAndResolveExpiredRace(server);

        expect(initiator.money).toBeCloseTo(INITIATION_COST[0] * REFUND_PERCENT);
        expect(server.race.active).toBe(false);
        expect(server.race.cooldownUntil).not.toBeNull();
    });

    test('on expired race with target reached: prestiges and resets player', async () => {
        const initiator = makePlayer({ money: 500000, wood: 50000, prestigeCount: 0, userId: 'u1',
            farmWidth: 5, farmHeight: 5, farmArea: 25, buildingSlots: 6 });
        initiator.farm = Array(25).fill(null).map(() => ({ name: 'Carrot', timer: new Date() }));
        initiator.building = Array(6).fill(null).map(() => ({ name: 'Lumber Mill', level: 1 }));
        Player.findOne.mockResolvedValue(initiator);

        const server = makeServer({
            active: true,
            initiatorId: 'u1',
            startTime: new Date(Date.now() - RACE_DURATION_MS - 1000),
            cropsHarvested: 300,
            targetCrops: 250,
        });

        await checkAndResolveExpiredRace(server);

        expect(initiator.prestigeCount).toBe(1);
        expect(initiator.money).toBe(0);
        expect(initiator.farmWidth).toBe(3);
        expect(initiator.farm.length).toBe(9);
        expect(initiator.farm[0].name).toBe('Empty');
        expect(server.race.active).toBe(false);
        expect(server.race.cooldownUntil).toBeNull();
    });
});

// ─── resolveRaceSuccess ───────────────────────────────────────────────────────

describe('resolveRaceSuccess', () => {
    test('increments prestige, resets player, clears server race', async () => {
        const initiator = makePlayer({ prestigeCount: 1, money: 999, userId: 'u1' });
        Player.findOne.mockResolvedValue(initiator);
        const server = makeServer({ active: true, initiatorId: 'u1', targetCrops: 500 });

        await resolveRaceSuccess(server);

        expect(initiator.prestigeCount).toBe(2);
        expect(initiator.money).toBe(0);
        expect(server.race.active).toBe(false);
        expect(server.race.cooldownUntil).toBeNull();
        expect(server.save).toHaveBeenCalledTimes(1);
    });
});
