const { give, makeContract, buyContract, deleteContract, buyResource } = require('../../src/services/trade.service.js');
const { makePlayer } = require('../helpers.js');

// ─── give ─────────────────────────────────────────────────────────────────────

describe('give', () => {
    test('returns error when sender and receiver are the same', async () => {
        const player = makePlayer({ wood: 100 });
        const result = await give(player, player, 'wood', 10, 'user1', 'user1');
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/yourself/i);
    });

    test('returns error when receiver is not found', async () => {
        const player = makePlayer({ wood: 100 });
        const result = await give(player, null, 'wood', 10, 'user1', 'user2');
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/not found/i);
    });

    test('returns error when amount is zero or negative', async () => {
        const sender = makePlayer({ wood: 100 });
        const receiver = makePlayer({ wood: 0 });
        const result = await give(sender, receiver, 'wood', 0, 'user1', 'user2');
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/positive/i);
    });

    test('returns error when sender has insufficient resources', async () => {
        const sender = makePlayer({ wood: 5 });
        const receiver = makePlayer({ wood: 0 });
        const result = await give(sender, receiver, 'wood', 10, 'user1', 'user2');
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/enough/i);
    });

    test('transfers resources and saves both players', async () => {
        const sender = makePlayer({ wood: 100 });
        const receiver = makePlayer({ wood: 0 });
        const result = await give(sender, receiver, 'wood', 30, 'user1', 'user2');
        expect(result.ok).toBe(true);
        expect(sender.wood).toBe(70);
        expect(receiver.wood).toBe(30);
        expect(sender.save).toHaveBeenCalledTimes(1);
        expect(receiver.save).toHaveBeenCalledTimes(1);
    });
});

// ─── makeContract ─────────────────────────────────────────────────────────────

describe('makeContract', () => {
    let ContractModel;

    beforeEach(() => {
        ContractModel = {
            findOne: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(null)
            }),
            create: jest.fn().mockResolvedValue({}),
        };
    });

    test('returns error when player has insufficient resources', async () => {
        const player = makePlayer({ wood: 5 });
        const result = await makeContract(player, 'user1', 'wood', 10, 100, ContractModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/enough/i);
    });

    test('returns error when price is zero or negative', async () => {
        const player = makePlayer({ wood: 200 });
        const result = await makeContract(player, 'user1', 'wood', 0, 100, ContractModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/positive/i);
    });

    test('creates contract and deducts resources', async () => {
        const player = makePlayer({ wood: 200 });
        const result = await makeContract(player, 'user1', 'wood', 5, 100, ContractModel);
        expect(result.ok).toBe(true);
        expect(player.wood).toBe(100);
        expect(player.save).toHaveBeenCalledTimes(1);
        expect(ContractModel.create).toHaveBeenCalledWith(expect.objectContaining({
            contractId: 1,
            userId: 'user1',
            resourceType: 'wood',
            price: 5,
            contractSize: 100,
        }));
    });

    test('increments contractId from previous max', async () => {
        const player = makePlayer({ wood: 200 });
        ContractModel.findOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ contractId: 7 })
        });
        await makeContract(player, 'user1', 'wood', 5, 100, ContractModel);
        expect(ContractModel.create).toHaveBeenCalledWith(expect.objectContaining({ contractId: 8 }));
    });
});

// ─── buyContract ──────────────────────────────────────────────────────────────

describe('buyContract', () => {
    let ContractModel, PlayerModel;

    const makeContract_ = (overrides = {}) => ({
        contractId: 1,
        userId: 'seller1',
        resourceType: 'wood',
        price: 10,
        contractSize: 50,
        save: jest.fn().mockResolvedValue(true),
        ...overrides
    });

    beforeEach(() => {
        ContractModel = {
            findOne: jest.fn(),
            deleteOne: jest.fn().mockResolvedValue({}),
        };
        PlayerModel = {
            updateOne: jest.fn().mockResolvedValue({}),
        };
    });

    test('returns error when contract is not found', async () => {
        ContractModel.findOne.mockResolvedValue(null);
        const player = makePlayer({ money: 999 });
        const result = await buyContract(player, 'buyer1', 1, 10, ContractModel, PlayerModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/not found/i);
    });

    test('returns error when buyer is the seller', async () => {
        ContractModel.findOne.mockResolvedValue(makeContract_({ userId: 'buyer1' }));
        const player = makePlayer({ money: 999 });
        const result = await buyContract(player, 'buyer1', 1, 10, ContractModel, PlayerModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/own contract/i);
    });

    test('returns error when buyer has insufficient money', async () => {
        ContractModel.findOne.mockResolvedValue(makeContract_()); // price=10, size=50
        const player = makePlayer({ money: 5 }); // needs 10 * 1 = $10
        const result = await buyContract(player, 'buyer1', 1, 1, ContractModel, PlayerModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/you need/i);
    });

    test('clamps buyAmount to contract size', async () => {
        const contract = makeContract_({ contractSize: 10 });
        ContractModel.findOne.mockResolvedValue(contract);
        const player = makePlayer({ money: 99999 });
        const result = await buyContract(player, 'buyer1', 1, 999, ContractModel, PlayerModel);
        expect(result.ok).toBe(true);
        expect(player.money).toBe(99999 - (10 * 10)); // clamped to 10 units at $10 each
    });

    test('partial purchase: deducts money, adds resource, reduces contract size', async () => {
        const contract = makeContract_({ contractSize: 50 });
        ContractModel.findOne.mockResolvedValue(contract);
        const player = makePlayer({ money: 9999 });
        const result = await buyContract(player, 'buyer1', 1, 10, ContractModel, PlayerModel);
        expect(result.ok).toBe(true);
        expect(player.money).toBe(9999 - 100); // 10 * $10
        expect(player.wood).toBe(10);
        expect(contract.contractSize).toBe(40);
        expect(contract.save).toHaveBeenCalledTimes(1);
        expect(ContractModel.deleteOne).not.toHaveBeenCalled();
    });

    test('full purchase: deletes contract', async () => {
        const contract = makeContract_({ contractSize: 10 });
        ContractModel.findOne.mockResolvedValue(contract);
        const player = makePlayer({ money: 9999 });
        await buyContract(player, 'buyer1', 1, 10, ContractModel, PlayerModel);
        expect(ContractModel.deleteOne).toHaveBeenCalledWith({ contractId: 1 });
        expect(contract.save).not.toHaveBeenCalled();
    });

    test('pays seller via updateOne (not document save)', async () => {
        const contract = makeContract_({ contractSize: 50, price: 10 });
        ContractModel.findOne.mockResolvedValue(contract);
        const player = makePlayer({ money: 9999 });
        await buyContract(player, 'buyer1', 1, 5, ContractModel, PlayerModel);
        expect(PlayerModel.updateOne).toHaveBeenCalledWith(
            { userId: 'seller1' },
            { $inc: { money: 50 } } // 5 units * $10
        );
    });
});

// ─── deleteContract ───────────────────────────────────────────────────────────

describe('deleteContract', () => {
    let ContractModel;

    beforeEach(() => {
        ContractModel = {
            findOne: jest.fn(),
            deleteOne: jest.fn().mockResolvedValue({}),
        };
    });

    test('returns error when contract is not found', async () => {
        ContractModel.findOne.mockResolvedValue(null);
        const player = makePlayer();
        const result = await deleteContract(player, 'user1', 1, ContractModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/not found/i);
    });

    test('returns error when user does not own the contract', async () => {
        ContractModel.findOne.mockResolvedValue({ contractId: 1, userId: 'otherUser', resourceType: 'wood', contractSize: 10 });
        const player = makePlayer();
        const result = await deleteContract(player, 'user1', 1, ContractModel);
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/someone else/i);
    });

    test('returns resources to player and deletes contract', async () => {
        ContractModel.findOne.mockResolvedValue({ contractId: 1, userId: 'user1', resourceType: 'wood', contractSize: 50 });
        const player = makePlayer({ wood: 10 });
        const result = await deleteContract(player, 'user1', 1, ContractModel);
        expect(result.ok).toBe(true);
        expect(player.wood).toBe(60); // 10 + 50 returned
        expect(player.save).toHaveBeenCalledTimes(1);
        expect(ContractModel.deleteOne).toHaveBeenCalledWith({ contractId: 1 });
    });
});

// ─── buyResource ──────────────────────────────────────────────────────────────

describe('buyResource', () => {
    test('returns error when player has insufficient money', async () => {
        const player = makePlayer({ money: 0 });
        const result = await buyResource(player, 10, 'wood');
        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/enough money/i);
    });

    test('deducts money and adds resource', async () => {
        const player = makePlayer({ money: 9999 });
        const result = await buyResource(player, 10, 'wood');
        expect(result.ok).toBe(true);
        expect(player.wood).toBe(10);
        expect(player.save).toHaveBeenCalledTimes(1);
    });
});
