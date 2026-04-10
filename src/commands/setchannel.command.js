const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Set the channel for welcome messages')
        .addChannelOption(option =>
            option.setName('channel').setDescription('Channel to send welcome messages to').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, player, server) {
        const channel = interaction.options.getChannel('channel');

        server.welcomeChannelId = channel.id;
        await server.save();

        await interaction.reply({ content: `Welcome messages will now be sent to ${channel}.`, ephemeral: true });
    },
};
