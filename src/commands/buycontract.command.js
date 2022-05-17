const { SlashCommandBuilder } = require('@discordjs/builders');
const Contract = require('../models/contract.model.js');
const Player = require('../models/player.model.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buycontract')
        .setDescription('Buy resources from a contract')
        .addNumberOption(option =>
            option
                .setName('contractnumber')
                .setDescription('ID of the contract, use `/list` to findout more')
                .setRequired(true))
        .addNumberOption(option =>
            option
                .setName('buyamount')
                .setDescription('How much resources to buy')
                .setRequired(true)),

    async execute(interaction, player) {
        const contractId = interaction.options.getNumber('contractnumber');
        const contract = await Contract.findOne({ contractId });
        let buyamount = interaction.options.getNumber('buyamount');

        if (contract == null) {
            await interaction.reply({ content: `Contract with number #${contractId} is not found`, ephemeral: true });
            return;
        }

        // return if buyer == seller
        if (contract.userId === interaction.user.id) {
            await interaction.reply({ content: `You cannot buy your own contract`, ephemeral: true });
            return;
        }

        // maximum buy amount is contract size
        if (buyamount > contract.contractSize) {
            buyamount = contract.contractSize;
        }

        // check if player has enough money
        if (player.money < buyamount * contract.price) {
            await interaction.reply({ content: `You need $${buyamount * contract.price} (You have $${player.money})`, ephemeral: true });
            return;
        }

        // Deal is made
        player.money -= buyamount * contract.price;
        player[contract.resourceType] += buyamount;
        contract.contractSize -= buyamount;

        Player.updateOne({ userId: contract.userId }, {
            $inc: {
                money: buyamount * contract.price
            }
        });

        player.save();

        // Check if contract is empty, if yes delete
        if (contract.contractSize === 0) {
            Contract.deleteOne({ contractId });
        } else
            contract.save();

        await interaction.reply(`<@${player.userId}> bought ${buyamount} ${contract.resourceType} from <@${contract.userId}> from contract #${contractId}`);
    },
};
