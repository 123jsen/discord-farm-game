const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
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
    async execute(interaction) {
        const type = interaction.options.getString('item');

        const fields = [];

        if (type == 'crops') {
            crops.forEach(crop => {
                if (crop.name === 'Empty') return;

                fields.push({
                    name: `${crop.image} ${crop.name}`,
                    value: `Cost: $${crop.cost} Value: $${crop.worth}`
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

        const priceEmbed = new MessageEmbed()
            .setColor('#a84232')
            .setTitle('Price List')
            .addFields(...fields);

        await interaction.reply({ embeds: [priceEmbed], ephemeral: true });
    },
};
