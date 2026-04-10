// Shared test helpers

function makePlayer(overrides = {}) {
    const farmWidth = overrides.farmWidth ?? 3;
    const farmHeight = overrides.farmHeight ?? 3;
    const farmArea = farmWidth * farmHeight;

    return {
        money: 100,
        wood: 0,
        stone: 0,
        metal: 0,
        farmWidth,
        farmHeight,
        farmArea,
        farm: Array(farmArea).fill(null).map(() => ({ name: 'Empty', timer: new Date() })),
        buildingWidth: 2,
        buildingSlots: 4,
        building: Array(4).fill(null).map(() => ({ name: 'Empty', level: 0 })),
        woodCapacity: 0,
        stoneCapacity: 0,
        metalCapacity: 0,
        save: jest.fn().mockResolvedValue(true),
        ...overrides
    };
}

const cropList = [
    { name: 'Empty', image: '🟫', cost: 0, worth: 0, growthTime: 0 },
    { name: 'Carrot', image: '🥕', cost: 20, worth: 28, growthTime: 40000 },
    { name: 'Mushroom', image: '🍄', cost: 25, worth: 40, growthTime: 45000 },
];

const buildingsList = [
    { name: 'Empty', target: 'empty', image: '🏗️' },
    {
        name: 'Lumber Mill', target: 'wood', image: '🪵',
        levels: [
            { level: 1, effect: 100, cost: [500, 0, 0, 0] },
            { level: 2, effect: 650, cost: [5000, 900, 400, 400] },
        ]
    },
    {
        name: 'Extra Plots', target: 'farmHeight', image: '🟫',
        levels: [
            { level: 1, cost: [0, 1000, 1000, 1000] },
            { level: 2, cost: [0, 70000, 70000, 70000] },
        ]
    },
];

const upgradesList = [
    {
        name: 'Farm Width', target: 'farmWidth',
        levels: [
            { level: 4, cost: [18000, 2500, 2500, 2500] },
            { level: 5, cost: [200000, 30000, 30000, 30000] },
        ]
    },
    {
        name: 'Extra Buildings', target: 'buildingSlots',
        levels: [
            { level: 5, cost: [50000, 12500, 12500, 12500] },
        ]
    }
];

module.exports = { makePlayer, cropList, buildingsList, upgradesList };
