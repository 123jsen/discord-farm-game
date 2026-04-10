const { upgrade } = require('../../src/services/upgrade.service.js');
const { makePlayer, upgradesList } = require('../helpers.js');

// ─── upgrade ──────────────────────────────────────────────────────────────────

describe('upgrade', () => {
    test('returns error when no next tier exists', async () => {
        // farmWidth starts at 3, upgradesList has levels 4 and 5. Set to 5 (max).
        const player = makePlayer({ farmWidth: 5, money: 999999, wood: 999999, stone: 999999, metal: 999999 });
        const result = await upgrade(player, 'farmWidth', upgradesList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/no next tier/i);
    });

    test('returns error when insufficient resources', async () => {
        const player = makePlayer({ farmWidth: 3, money: 0, wood: 0, stone: 0, metal: 0 });
        const result = await upgrade(player, 'farmWidth', upgradesList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/you need/i);
    });

    test('upgrades farmWidth: deducts resources and expands farm array', async () => {
        // farmWidth 3 -> 4, cost: [18000, 2500, 2500, 2500]
        const player = makePlayer({ farmWidth: 3, farmHeight: 3, farmArea: 9, money: 99999, wood: 99999, stone: 99999, metal: 99999 });
        const initialFarmLength = player.farm.length;
        const result = await upgrade(player, 'farmWidth', upgradesList);
        expect(result.ok).toBe(true);
        expect(player.farmWidth).toBe(4);
        expect(player.money).toBe(99999 - 18000);
        expect(player.wood).toBe(99999 - 2500);
        // farm should grow by farmHeight (3) new slots
        expect(player.farm.length).toBe(initialFarmLength + 3);
        expect(player.save).toHaveBeenCalledTimes(1);
    });

    test('upgrades buildingSlots: adds a new empty building slot', async () => {
        // buildingSlots 4 -> 5, cost: [50000, 12500, 12500, 12500]
        const player = makePlayer({ buildingSlots: 4, money: 999999, wood: 999999, stone: 999999, metal: 999999 });
        const initialBuildingLength = player.building.length;
        const result = await upgrade(player, 'buildingSlots', upgradesList);
        expect(result.ok).toBe(true);
        expect(player.buildingSlots).toBe(5);
        expect(player.building.length).toBe(initialBuildingLength + 1);
        expect(player.building[player.building.length - 1]).toEqual({ name: 'Empty', level: 0 });
    });

    test('success message contains upgrade name and tier', async () => {
        const player = makePlayer({ farmWidth: 3, money: 99999, wood: 99999, stone: 99999, metal: 99999 });
        const result = await upgrade(player, 'farmWidth', upgradesList);
        expect(result.message).toContain('Farm Width');
        expect(result.message).toContain('4'); // tier level
    });
});
