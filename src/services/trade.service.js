// Trade service — handles give, contracts, and resource buying

const { GOLD_PER_RESOURCES } = require('../../data/config.json');

/**
 * Give resources from one player to another.
 * @param {object} senderPlayer   - Mongoose player document (sender)
 * @param {object} receiverPlayer - Mongoose player document (receiver), or null if not found
 * @param {string} resourceType   - 'money' | 'wood' | 'stone' | 'metal'
 * @param {number} amount
 * @param {string} senderUserId   - Discord user ID of sender
 * @param {string} receiverUserId - Discord user ID of receiver
 * @returns {{ ok: boolean, message: string }}
 */
async function give(senderPlayer, receiverPlayer, resourceType, amount, senderUserId, receiverUserId) {
    if (senderUserId === receiverUserId) {
        return { ok: false, message: 'You cannot give resources to yourself' };
    }

    if (!receiverPlayer) {
        return { ok: false, message: 'That Player is not found' };
    }

    if (amount <= 0) {
        return { ok: false, message: 'Please give a positive number' };
    }

    if (senderPlayer[resourceType] < amount) {
        return { ok: false, message: `You don't have enough ${resourceType}` };
    }

    senderPlayer[resourceType] -= amount;
    receiverPlayer[resourceType] += amount;

    await senderPlayer.save();
    await receiverPlayer.save();

    return { ok: true, message: `<@${senderUserId}> gave ${amount} ${resourceType} to <@${receiverUserId}>` };
}

/**
 * Post a contract to sell resources.
 * @param {object} player        - Mongoose player document (seller)
 * @param {string} userId        - Discord user ID of the seller
 * @param {string} resourceType  - 'wood' | 'stone' | 'metal'
 * @param {number} price         - per-unit price
 * @param {number} contractSize  - number of resources in contract
 * @param {object} ContractModel - Mongoose Contract model
 * @returns {{ ok: boolean, message: string }}
 */
async function makeContract(player, userId, resourceType, price, contractSize, ContractModel) {
    if (contractSize <= 0) {
        return { ok: false, message: 'Contract size must be a positive number' };
    }

    if (player[resourceType] < contractSize) {
        return { ok: false, message: `You do not have enough ${resourceType} (You have ${Math.round(player[resourceType])})` };
    }

    if (price <= 0) {
        return { ok: false, message: 'Please set a positive price' };
    }

    const prevContract = await ContractModel.findOne().sort({ contractId: -1 }).limit(1);
    const nextContractId = parseInt(prevContract?.contractId ?? 0) + 1;

    player[resourceType] -= contractSize;
    await player.save();

    await ContractModel.create({ contractId: nextContractId, userId, price, resourceType, contractSize });

    return { ok: true, message: `Contract (#${nextContractId}) posted: ${contractSize} ${resourceType} for sale at $${price} each` };
}

/**
 * Buy resources from a posted contract.
 * @param {object} buyerPlayer   - Mongoose player document (buyer)
 * @param {string} buyerUserId   - Discord user ID of buyer
 * @param {number} contractId
 * @param {number} buyAmount
 * @param {object} ContractModel - Mongoose Contract model
 * @param {object} PlayerModel   - Mongoose Player model (for seller's money update)
 * @returns {{ ok: boolean, message: string }}
 */
async function buyContract(buyerPlayer, buyerUserId, contractId, buyAmount, ContractModel, PlayerModel) {
    const contract = await ContractModel.findOne({ contractId });

    if (!contract) {
        return { ok: false, message: `Contract with number #${contractId} is not found` };
    }

    if (contract.userId === buyerUserId) {
        return { ok: false, message: 'You cannot buy your own contract' };
    }

    // Clamp to contract size
    if (buyAmount > contract.contractSize) {
        buyAmount = contract.contractSize;
    }

    if (buyAmount <= 0) {
        return { ok: false, message: 'Amount must be a positive number' };
    }

    if (buyerPlayer.money < buyAmount * contract.price) {
        return { ok: false, message: `You need $${buyAmount * contract.price} (You have $${buyerPlayer.money})` };
    }

    buyerPlayer.money -= buyAmount * contract.price;
    buyerPlayer[contract.resourceType] += buyAmount;
    contract.contractSize -= buyAmount;

    // Use updateOne to avoid loading and overwriting seller's full document
    await PlayerModel.updateOne({ userId: contract.userId }, { $inc: { money: buyAmount * contract.price } });
    await buyerPlayer.save();

    if (contract.contractSize === 0) {
        await ContractModel.deleteOne({ contractId });
    } else {
        await contract.save();
    }

    return { ok: true, message: `<@${buyerUserId}> bought ${buyAmount} ${contract.resourceType} from <@${contract.userId}> from contract #${contractId}` };
}

/**
 * Delete a player's own contract and return the held resources.
 * @param {object} player        - Mongoose player document
 * @param {string} userId        - Discord user ID (ownership check)
 * @param {number} contractId
 * @param {object} ContractModel - Mongoose Contract model
 * @returns {{ ok: boolean, message: string }}
 */
async function deleteContract(player, userId, contractId, ContractModel) {
    const contract = await ContractModel.findOne({ contractId });

    if (!contract) {
        return { ok: false, message: `Contract with number #${contractId} is not found` };
    }

    if (contract.userId !== userId) {
        return { ok: false, message: `You cannot delete someone else's contract` };
    }

    player[contract.resourceType] += contract.contractSize;
    await player.save();

    await ContractModel.deleteOne({ contractId });

    return { ok: true, message: `Deleted contract #${contractId}` };
}

/**
 * Buy resources with money from the system.
 * @param {object} player        - Mongoose player document
 * @param {number} amount
 * @param {string} resourceType  - 'wood' | 'stone' | 'metal'
 * @returns {{ ok: boolean, message: string }}
 */
async function buyResource(player, amount, resourceType) {
    if (amount <= 0) {
        return { ok: false, message: 'Amount must be a positive number' };
    }

    if (player.money < amount * GOLD_PER_RESOURCES) {
        return { ok: false, message: `You don't have enough money` };
    }

    player.money -= amount * GOLD_PER_RESOURCES;
    player[resourceType] += amount;
    await player.save();

    return { ok: true, message: `You bought ${amount} ${resourceType} with $${amount * GOLD_PER_RESOURCES}` };
}

module.exports = { give, makeContract, buyContract, deleteContract, buyResource };
