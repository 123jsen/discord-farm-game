const { SlashCommandBuilder } = require('discord.js');
const upgrades = require('../../data/upgrades/export.js');
const upgradeService = require('../services/upgrade.service.js');

const choices = [];
upgrades.forEach(upgrade => {
    choices.push({ name: upgrade.name, value: upgrade.target });
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upgrade')
        .setDescription('Upgrade your farm and tools')
        .addStringOption(option =>
            option.setName('type').setDescription('Item to be upgraded').setRequired(true)
                .addChoices(...choices)),

    async execute(interaction, player) {
        const upgradeTarget = interaction.options.getString('type');

        const result = await upgradeService.upgrade(player, upgradeTarget, upgrades);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        await interaction.reply(result.message);
    },
};
