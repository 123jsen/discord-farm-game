const { build, destroy, checkBuild } = require('../../src/services/build.service.js');
const { makePlayer, buildingsList } = require('../helpers.js');

const REFUND_PERCENT = 0.5;

// Mock PlayerModel — calculateBuildingsEffect is a static method
const PlayerModel = {
    calculateBuildingsEffect: jest.fn(),
};

beforeEach(() => {
    PlayerModel.calculateBuildingsEffect.mockClear();
});

// ─── build ────────────────────────────────────────────────────────────────────

describe('build — new construction', () => {
    test('returns error when col is out of bounds', async () => {
        const player = makePlayer();
        const result = await build(player, 0, 2, 'wood', buildingsList, PlayerModel); // col 2 >= buildingWidth 2
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/out of bound/i);
    });

    test('returns error when index exceeds buildingSlots', async () => {
        const player = makePlayer();
        const result = await build(player, 3, 0, 'wood', buildingsList, PlayerModel); // index = 3*2+0 = 6 >= slots 4
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/out of bound/i);
    });

    test('returns error when insufficient money/resources', async () => {
        const player = makePlayer({ money: 0 });
        const result = await build(player, 0, 0, 'wood', buildingsList, PlayerModel); // lumber mill lv1 costs $500
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/you need/i);
    });

    test('builds successfully on empty slot', async () => {
        const player = makePlayer({ money: 1000 });
        const result = await build(player, 0, 0, 'wood', buildingsList, PlayerModel);
        expect(result.ok).toBe(true);
        expect(player.building[0].name).toBe('Lumber Mill');
        expect(player.building[0].level).toBe(1);
        expect(player.money).toBe(500); // 1000 - 500
        expect(PlayerModel.calculateBuildingsEffect).toHaveBeenCalledWith(player);
        expect(player.save).toHaveBeenCalledTimes(1);
    });

    test('expands farm array when building farmHeight', async () => {
        const player = makePlayer({ wood: 5000, stone: 5000, metal: 5000 });
        const initialFarmLength = player.farm.length;
        await build(player, 0, 0, 'farmHeight', buildingsList, PlayerModel);
        expect(player.farm.length).toBe(initialFarmLength + player.farmWidth);
    });
});

describe('build — upgrade existing', () => {
    test('returns error when existing building is a different type', async () => {
        const player = makePlayer({ money: 9999, wood: 9999, stone: 9999, metal: 9999 });
        player.building[0] = { name: 'Stone Quarry', level: 1 };
        const result = await build(player, 0, 0, 'wood', buildingsList, PlayerModel); // trying to build Lumber Mill where Stone Quarry is
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/already here/i);
    });

    test('returns error when building is at max level', async () => {
        const player = makePlayer({ money: 9999, wood: 9999, stone: 9999, metal: 9999 });
        player.building[0] = { name: 'Lumber Mill', level: 2 }; // max in test data is level 2
        const result = await build(player, 0, 0, 'wood', buildingsList, PlayerModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/cannot upgrade/i);
    });

    test('returns error when insufficient resources for upgrade', async () => {
        const player = makePlayer({ money: 0 });
        player.building[0] = { name: 'Lumber Mill', level: 1 };
        const result = await build(player, 0, 0, 'wood', buildingsList, PlayerModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/you need/i);
    });

    test('upgrades building successfully', async () => {
        const player = makePlayer({ money: 9999, wood: 9999, stone: 9999, metal: 9999 });
        player.building[0] = { name: 'Lumber Mill', level: 1 };
        const result = await build(player, 0, 0, 'wood', buildingsList, PlayerModel);
        expect(result.ok).toBe(true);
        expect(player.building[0].level).toBe(2);
        expect(PlayerModel.calculateBuildingsEffect).toHaveBeenCalledWith(player);
        expect(player.save).toHaveBeenCalledTimes(1);
    });
});

// ─── destroy ──────────────────────────────────────────────────────────────────

describe('destroy', () => {
    test('returns error when out of bounds', async () => {
        const player = makePlayer();
        const result = await destroy(player, 0, 2, buildingsList, REFUND_PERCENT, PlayerModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/out of bound/i);
    });

    test('returns error when slot is empty', async () => {
        const player = makePlayer();
        const result = await destroy(player, 0, 0, buildingsList, REFUND_PERCENT, PlayerModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/empty/i);
    });

    test('refunds resources and resets slot', async () => {
        const player = makePlayer({ money: 0 });
        player.building[0] = { name: 'Lumber Mill', level: 1 }; // cost was [500, 0, 0, 0]
        const result = await destroy(player, 0, 0, buildingsList, REFUND_PERCENT, PlayerModel);
        expect(result.ok).toBe(true);
        expect(player.money).toBe(250); // 500 * 0.5
        expect(player.building[0].name).toBe('Empty');
        expect(player.building[0].level).toBe(0);
        expect(PlayerModel.calculateBuildingsEffect).toHaveBeenCalledWith(player);
        expect(player.save).toHaveBeenCalledTimes(1);
    });
});

// ─── checkBuild ───────────────────────────────────────────────────────────────

describe('checkBuild', () => {
    test('returns error when out of bounds', () => {
        const player = makePlayer();
        const result = checkBuild(player, 0, 2);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/out of bound/i);
    });

    test('returns empty message when slot is empty', () => {
        const player = makePlayer();
        const result = checkBuild(player, 0, 0);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/empty/i);
    });

    test('returns building name and level', () => {
        const player = makePlayer();
        player.building[0] = { name: 'Lumber Mill', level: 2 };
        const result = checkBuild(player, 0, 0);
        expect(result.message).toContain('Lumber Mill');
        expect(result.message).toContain('2');
    });
});
