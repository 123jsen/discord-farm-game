const { plant, plantAll, harvest, checkCrop, checkAllCrops } = require('../../src/services/farm.service.js');
const { makePlayer, cropList } = require('../helpers.js');

// ─── plant ────────────────────────────────────────────────────────────────────

describe('plant', () => {
    test('returns error when row is out of bounds', async () => {
        const player = makePlayer({ money: 500 });
        const result = await plant(player, 3, 0, 'Carrot', cropList); // row 3 >= farmHeight 3
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/out of bound/i);
    });

    test('returns error when col is out of bounds', async () => {
        const player = makePlayer({ money: 500 });
        const result = await plant(player, 0, 3, 'Carrot', cropList); // col 3 >= farmWidth 3
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/out of bound/i);
    });

    test('returns error when player has insufficient money', async () => {
        const player = makePlayer({ money: 5 });
        const result = await plant(player, 0, 0, 'Carrot', cropList); // carrot costs 20
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/enough money/i);
    });

    test('returns error when cell is already occupied', async () => {
        const player = makePlayer({ money: 500 });
        player.farm[0] = { name: 'Carrot', timer: new Date() };
        const result = await plant(player, 0, 0, 'Carrot', cropList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/not empty/i);
    });

    test('plants crop, deducts money, calls save on success', async () => {
        const player = makePlayer({ money: 500 });
        const result = await plant(player, 0, 0, 'Carrot', cropList);
        expect(result.ok).toBe(true);
        expect(result.message).toContain('Carrot');
        expect(player.money).toBe(480); // 500 - 20
        expect(player.farm[0].name).toBe('Carrot');
        expect(player.save).toHaveBeenCalledTimes(1);
    });

    test('plants at correct index using row-major order', async () => {
        const player = makePlayer({ money: 500 }); // 3x3 farm
        await plant(player, 1, 2, 'Carrot', cropList); // index = 1*3+2 = 5
        expect(player.farm[5].name).toBe('Carrot');
        expect(player.farm[0].name).toBe('Empty');
    });

    test('succeeds at last valid position (boundary)', async () => {
        const player = makePlayer({ money: 500 }); // 3x3
        const result = await plant(player, 2, 2, 'Carrot', cropList); // row=2, col=2, both = farmHeight/Width - 1
        expect(result.ok).toBe(true);
    });
});

// ─── plantAll ─────────────────────────────────────────────────────────────────

describe('plantAll', () => {
    test('returns error for unknown crop name', async () => {
        const player = makePlayer({ money: 500 });
        const result = await plantAll(player, 'NonExistentCrop', cropList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/not found/i);
    });

    test('returns error when farm is completely full', async () => {
        const player = makePlayer({ money: 500 });
        player.farm.forEach(slot => { slot.name = 'Carrot'; });
        const result = await plantAll(player, 'Carrot', cropList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/full/i);
    });

    test('returns error when player has no money for even one crop', async () => {
        const player = makePlayer({ money: 5 });
        const result = await plantAll(player, 'Carrot', cropList); // carrot costs 20
        expect(result.ok).toBe(false);
        expect(result.message).toContain('$5');
    });

    test('plants as many as money allows', async () => {
        const player = makePlayer({ money: 50 }); // enough for 2 carrots at $20 each
        const result = await plantAll(player, 'Carrot', cropList);
        expect(result.ok).toBe(true);
        expect(result.message).toContain('2 Carrot');
        expect(player.money).toBe(10);
        const planted = player.farm.filter(f => f.name === 'Carrot').length;
        expect(planted).toBe(2);
    });

    test('plants all 9 plots when money is sufficient', async () => {
        const player = makePlayer({ money: 9999 });
        const result = await plantAll(player, 'Carrot', cropList);
        expect(result.ok).toBe(true);
        const planted = player.farm.filter(f => f.name === 'Carrot').length;
        expect(planted).toBe(9);
    });

    test('skips already occupied plots', async () => {
        const player = makePlayer({ money: 9999 });
        player.farm[0] = { name: 'Mushroom', timer: new Date() };
        await plantAll(player, 'Carrot', cropList);
        expect(player.farm[0].name).toBe('Mushroom'); // untouched
        const carrots = player.farm.filter(f => f.name === 'Carrot').length;
        expect(carrots).toBe(8); // 9 - 1 occupied
    });

    test('calls save on success', async () => {
        const player = makePlayer({ money: 9999 });
        await plantAll(player, 'Carrot', cropList);
        expect(player.save).toHaveBeenCalledTimes(1);
    });

    test('plants all extra plots when farmHeight is expanded', async () => {
        const player = makePlayer({ money: 9999, farmHeight: 4 }); // 3x4 = 12 plots
        const result = await plantAll(player, 'Carrot', cropList);
        expect(result.ok).toBe(true);
        const planted = player.farm.filter(f => f.name === 'Carrot').length;
        expect(planted).toBe(12);
    });

    test('returns full error correctly when all extra plots are occupied', async () => {
        const player = makePlayer({ money: 9999, farmHeight: 4 }); // 12 plots
        player.farm.forEach(slot => { slot.name = 'Carrot'; });
        const result = await plantAll(player, 'Carrot', cropList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/full/i);
    });

    test('plants only in empty extra plots, skips occupied base plots', async () => {
        const player = makePlayer({ money: 9999, farmHeight: 4 }); // 3x4 = 12 plots
        // Fill base 3x3 (indices 0-8)
        for (let i = 0; i < 9; i++) player.farm[i] = { name: 'Mushroom', timer: new Date() };
        const result = await plantAll(player, 'Carrot', cropList);
        expect(result.ok).toBe(true);
        const carrots = player.farm.filter(f => f.name === 'Carrot').length;
        expect(carrots).toBe(3); // only the 3 extra plots
        const mushrooms = player.farm.filter(f => f.name === 'Mushroom').length;
        expect(mushrooms).toBe(9); // base plots untouched
    });
});

// ─── harvest ──────────────────────────────────────────────────────────────────

describe('harvest', () => {
    test('returns error when all plots are empty', async () => {
        const player = makePlayer();
        const result = await harvest(player, cropList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/nothing/i);
    });

    test('returns error when crops are planted but none are mature', async () => {
        const player = makePlayer({ money: 0 });
        player.farm[0] = { name: 'Carrot', timer: new Date() }; // just planted, not mature
        const result = await harvest(player, cropList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/nothing/i);
    });

    test('harvests a single mature crop and adds money', async () => {
        const player = makePlayer({ money: 0 });
        const pastDate = new Date(Date.now() - 99999); // older than any growthTime
        player.farm[0] = { name: 'Carrot', timer: pastDate };
        const result = await harvest(player, cropList);
        expect(result.ok).toBe(true);
        expect(player.money).toBe(28); // carrot worth
        expect(player.farm[0].name).toBe('Empty');
        expect(player.save).toHaveBeenCalledTimes(1);
    });

    test('harvests multiple mature crops and sums gains', async () => {
        const player = makePlayer({ money: 0 });
        const pastDate = new Date(Date.now() - 99999);
        player.farm[0] = { name: 'Carrot', timer: pastDate };
        player.farm[1] = { name: 'Mushroom', timer: pastDate };
        const result = await harvest(player, cropList);
        expect(result.ok).toBe(true);
        expect(player.money).toBe(68); // 28 + 40
    });

    test('only harvests mature crops, leaves immature ones untouched', async () => {
        const player = makePlayer({ money: 0 });
        const pastDate = new Date(Date.now() - 99999);
        player.farm[0] = { name: 'Carrot', timer: pastDate }; // mature
        player.farm[1] = { name: 'Carrot', timer: new Date() }; // not mature
        await harvest(player, cropList);
        expect(player.farm[0].name).toBe('Empty');
        expect(player.farm[1].name).toBe('Carrot'); // untouched
    });
});

// ─── harvest — prestige multiplier & race tracking ────────────────────────────

describe('harvest — prestige multiplier', () => {
    test('applies 1.15x multiplier for 1 prestige and rounds down', async () => {
        const player = makePlayer({ money: 0, prestigeCount: 1 });
        const pastDate = new Date(Date.now() - 99999);
        player.farm[0] = { name: 'Carrot', timer: pastDate }; // worth $28
        await harvest(player, cropList);
        expect(player.money).toBe(Math.round(28 * 1.15)); // 32
    });

    test('stacks multiplier multiplicatively across multiple prestiges', async () => {
        const player = makePlayer({ money: 0, prestigeCount: 3 });
        const pastDate = new Date(Date.now() - 99999);
        player.farm[0] = { name: 'Carrot', timer: pastDate };
        await harvest(player, cropList);
        expect(player.money).toBe(Math.round(28 * Math.pow(1.15, 3)));
    });

    test('no multiplier when prestigeCount is 0', async () => {
        const player = makePlayer({ money: 0, prestigeCount: 0 });
        const pastDate = new Date(Date.now() - 99999);
        player.farm[0] = { name: 'Carrot', timer: pastDate };
        await harvest(player, cropList);
        expect(player.money).toBe(28);
    });
});

describe('harvest — race tracking', () => {
    function makeActiveServer(cropsHarvested = 0) {
        return {
            race: { active: true, cropsHarvested },
            save: jest.fn().mockResolvedValue(true)
        };
    }

    test('increments server race crop count on harvest', async () => {
        const player = makePlayer({ money: 0 });
        const pastDate = new Date(Date.now() - 99999);
        player.farm[0] = { name: 'Carrot', timer: pastDate };
        player.farm[1] = { name: 'Mushroom', timer: pastDate };
        const server = makeActiveServer(10);
        await harvest(player, cropList, server);
        expect(server.race.cropsHarvested).toBe(12); // 10 + 2 crops
        expect(server.save).toHaveBeenCalledTimes(1);
    });

    test('does not update server when no crops are harvested', async () => {
        const player = makePlayer({ money: 0 });
        const server = makeActiveServer(10);
        await harvest(player, cropList, server); // all empty, nothing harvested
        expect(server.save).not.toHaveBeenCalled();
    });

    test('works fine without server argument (no race active)', async () => {
        const player = makePlayer({ money: 0 });
        const pastDate = new Date(Date.now() - 99999);
        player.farm[0] = { name: 'Carrot', timer: pastDate };
        const result = await harvest(player, cropList); // no server passed
        expect(result.ok).toBe(true);
    });
});

// ─── checkCrop ────────────────────────────────────────────────────────────────

describe('checkCrop', () => {
    test('returns error when row is out of bounds', () => {
        const player = makePlayer();
        const result = checkCrop(player, 5, 0, cropList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/out of bound/i);
    });

    test('returns error when cell is empty', () => {
        const player = makePlayer();
        const result = checkCrop(player, 0, 0, cropList);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/no crop/i);
    });

    test('returns ready message when crop is mature', () => {
        const player = makePlayer();
        player.farm[0] = { name: 'Carrot', timer: new Date(Date.now() - 99999) };
        const result = checkCrop(player, 0, 0, cropList);
        expect(result.message).toMatch(/ready/i);
    });

    test('returns minutes and seconds when more than 60s remaining', () => {
        const player = makePlayer();
        player.farm[0] = { name: 'Carrot', timer: new Date() }; // just planted, ~40s to go... actually 40000ms = 40s
        // Use Mushroom (45s growth) to get >60s remaining by backdating only slightly
        player.farm[0] = { name: 'Mushroom', timer: new Date(Date.now() - 1000) }; // 44s remaining — actually 45000-1000=44000ms < 60s
        // Use a crop with longer growth: set timer to just now with growthTime of 200000ms
        // Simulate by using a fresh timer on Mushroom which has 45s (< 60) — not ideal.
        // Instead test directly: set timer 1s ago for a crop with growthTime 200000ms by extending cropList
        const longCropList = [
            ...cropList,
            { name: 'LongCrop', image: '🌱', cost: 10, worth: 10, growthTime: 200000 }
        ];
        player.farm[0] = { name: 'LongCrop', timer: new Date(Date.now() - 1000) }; // ~199s remaining
        const result = checkCrop(player, 0, 0, longCropList);
        expect(result.message).toMatch(/minutes/i);
    });

    test('returns seconds only when less than 60s remaining', () => {
        const player = makePlayer();
        // Carrot growthTime=40000ms, timer set 1000ms ago => 39000ms remaining = 39s
        player.farm[0] = { name: 'Carrot', timer: new Date(Date.now() - 1000) };
        const result = checkCrop(player, 0, 0, cropList);
        expect(result.message).toMatch(/seconds/i);
        expect(result.message).not.toMatch(/minutes/i);
    });
});

// ─── checkAllCrops ────────────────────────────────────────────────────────────

describe('checkAllCrops', () => {
    test('returns empty array when farm is empty', () => {
        const player = makePlayer();
        const result = checkAllCrops(player, cropList);
        expect(result).toEqual([]);
    });

    test('shows a ready crop correctly', () => {
        const player = makePlayer();
        player.farm[0] = { name: 'Carrot', timer: new Date(Date.now() - 99999) };
        const result = checkAllCrops(player, cropList);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Carrot');
        expect(result[0].ready).toBe(1);
        expect(result[0].batches).toEqual([]);
    });

    test('shows a pending crop with correct time bucket', () => {
        const player = makePlayer();
        player.farm[0] = { name: 'Carrot', timer: new Date(Date.now() - 1000) };
        const result = checkAllCrops(player, cropList);
        expect(result).toHaveLength(1);
        expect(result[0].ready).toBe(0);
        expect(result[0].batches).toHaveLength(1);
        expect(result[0].batches[0].count).toBe(1);
        expect(result[0].batches[0].secs).toBeGreaterThan(0);
        expect(result[0].batches[0].secs).toBeLessThanOrEqual(40);
    });

    test('batches crops of the same type planted at the same time', () => {
        const player = makePlayer();
        const timer = new Date(Date.now() - 1000);
        player.farm[0] = { name: 'Carrot', timer };
        player.farm[1] = { name: 'Carrot', timer };
        player.farm[2] = { name: 'Carrot', timer };
        const result = checkAllCrops(player, cropList);
        expect(result).toHaveLength(1);
        expect(result[0].batches).toHaveLength(1);
        expect(result[0].batches[0].count).toBe(3);
    });

    test('splits into two batches when times differ by more than 10s', () => {
        const player = makePlayer();
        player.farm[0] = { name: 'Carrot', timer: new Date(Date.now() - 1000) };  // ~39s left
        player.farm[1] = { name: 'Carrot', timer: new Date(Date.now() - 25000) }; // ~15s left
        const result = checkAllCrops(player, cropList);
        expect(result[0].batches).toHaveLength(2);
    });

    test('groups separate crop types into separate entries', () => {
        const player = makePlayer();
        const pastDate = new Date(Date.now() - 99999);
        player.farm[0] = { name: 'Carrot', timer: pastDate };
        player.farm[1] = { name: 'Mushroom', timer: new Date(Date.now() - 1000) };
        const result = checkAllCrops(player, cropList);
        expect(result).toHaveLength(2);
        const names = result.map(g => g.name);
        expect(names).toContain('Carrot');
        expect(names).toContain('Mushroom');
    });

    test('sorts groups with ready crops first', () => {
        const player = makePlayer();
        player.farm[0] = { name: 'Mushroom', timer: new Date(Date.now() - 1000) };
        player.farm[1] = { name: 'Carrot',   timer: new Date(Date.now() - 99999) };
        const result = checkAllCrops(player, cropList);
        expect(result[0].name).toBe('Carrot');
        expect(result[1].name).toBe('Mushroom');
    });

    test('mixes ready and pending correctly within the same crop type', () => {
        const player = makePlayer();
        player.farm[0] = { name: 'Carrot', timer: new Date(Date.now() - 99999) };
        player.farm[1] = { name: 'Carrot', timer: new Date(Date.now() - 1000) };
        const result = checkAllCrops(player, cropList);
        expect(result).toHaveLength(1);
        expect(result[0].ready).toBe(1);
        expect(result[0].batches).toHaveLength(1);
    });

    test('ignores empty slots', () => {
        const player = makePlayer();
        player.farm[0] = { name: 'Carrot', timer: new Date(Date.now() - 99999) };
        const result = checkAllCrops(player, cropList);
        expect(result).toHaveLength(1);
    });
});
