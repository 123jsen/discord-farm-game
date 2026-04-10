const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Contract = require('../models/contract.model.js');
const buildings = require('../../data/buildings/export.js');
const crops = require('../../data/crops/export.js');
const upgrades = require('../../data/upgrades/export.js');

const choices = [
    {
        name: 'Crops',
        value: 'crops'
    },
    {
        name: 'Buildings',
        value: 'buildings'
    },
    {
        name: 'Upgrades',
        value: 'upgrades'
    },
    {
        name: 'Contracts',
        value: 'contracts'
    }
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Check prices')
        .addStringOption(option =>
            option
                .setName('item')
                .setDescription('Check price of items')
                .setRequired(true)
                .addChoices(...choices)),
    async execute(interaction, player) {
        const type = interaction.options.getString('item');

        let title = 'Price List';
        const fields = [];

        if (type == 'crops') {
            crops.forEach(crop => {
                if (crop.name === 'Empty') return;

                const totalSecs = crop.growthTime / 1000;
                const hrs  = Math.floor(totalSecs / 3600);
                const mins = Math.floor((totalSecs % 3600) / 60);
                const secs = totalSecs % 60;
                const timeStr = [
                    hrs  > 0 ? `${hrs}h`  : null,
                    mins > 0 ? `${mins}m` : null,
                    secs > 0 ? `${secs}s` : null,
                ].filter(Boolean).join(' ');
                fields.push({
                    name: `${crop.image} ${crop.name}`,
                    value: `${crop.description}\nCost: $${crop.cost} | Value: $${crop.worth} | Time: ${timeStr}`
                })
            })
        }
        else if (type == 'buildings') {
            buildings.forEach(build => {
                if (build.name === 'Empty') return;

                build.levels.forEach(level => {
                    let valueStr = '';
                    if (level.effect != undefined) {
                        valueStr = valueStr.concat(`Value: ${level.effect} ${build.image}/hr \n`);
                    }
                    valueStr = valueStr.concat(`Cost: $${level.cost[0]}, ${level.cost[1]} 🪵, ${level.cost[2]} 🪨, ${level.cost[3]} 🔧`);
                    fields.push({
                        name: `${build.image} ${build.name} level ${level.level}`,
                        value: valueStr
                    })
                })
            })
        }
        else if (type == 'upgrades') {
            upgrades.forEach(upgrade => {
                upgrade.levels.forEach(level => {
                    fields.push({
                        name: `${upgrade.name} level ${level.level}`,
                        value: `Cost: $${level.cost[0]}, ${level.cost[1]} 🪵, ${level.cost[2]} 🪨, ${level.cost[3]} 🔧`
                    })
                })
            })
        }
        else if (type == 'contracts') {
            const contracts = await Contract.find().sort({ price: 1 });
            if (contracts.length == 0) {
                await interaction.reply({ content: 'No contracts are posted', ephemeral: true });
                return;
            }

            contracts.forEach(contract => {
                fields.push({
                    name: `ID: #${contract.contractId}`,
                    value: `${contract.contractSize} ${contract.resourceType}, $${contract.price} each by <@${contract.userId}>`
                })
            })
        }

        const listEmbed = new EmbedBuilder()
            .setColor('#a84232')
            .setTitle(title)
            .addFields(...fields);

        await interaction.reply({ embeds: [listEmbed], ephemeral: true });
    },
};
