const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkbuild')
        .setDescription('Check the level of a building')
        .addIntegerOption(option =>
            option
                .setName('row')
                .setDescription('Build building at row.')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('col')
                .setDescription('Build building at column.')
                .setRequired(true)),

    async execute(interaction, player) {
        const row = interaction.options.getInteger('row') - 1;
        const col = interaction.options.getInteger('col') - 1;

        const index = row * player.buildingWidth + col;

        if (col >= player.buildingWidth || index >= player.buildingSlots) {
            await interaction.reply({ content: 'Coordinates are out of bound', ephemeral: true });
            return;
        }

        const current = player.building[index];

        if (current.name == 'Empty') {
            await interaction.reply({ content: 'Building plot is empty', ephemeral: true });
        }
        else {
            await interaction.reply({ content: `Level ${current.level} ${current.name} is built here`, ephemeral: true });
        }
    },
};
