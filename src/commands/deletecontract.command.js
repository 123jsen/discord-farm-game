const { SlashCommandBuilder } = require('@discordjs/builders');
const Contract = require('../models/contract.model.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletecontract')
        .setDescription('Delete your contract')
        .addNumberOption(option =>
            option
                .setName('contractnumber')
                .setDescription('ID of the contract, use `/list` to findout more')
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
        if (contract.userId != interaction.user.id) {
            await interaction.reply({ content: `You cannot delete someone else's contract`, ephemeral: true });
            return;
        }

        // Deal is made
        player[contract.resourceType] += contract.contractSize;

        player.save();
        Contract.deleteOne({ contractId }).exec();

        await interaction.reply({ content: `Deleted contract #${contractId}`, ephemeral: true });
    },
};
