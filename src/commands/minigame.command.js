const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const minigameService = require('../services/minigame.service.js');

const MAX_GUESSES = 6;

function buildEmbed(game, status = null) {
    const embed = new EmbedBuilder()
        .setTitle('🔢 Code Breaker')
        .setColor(status === 'won' ? 0x57F287 : status === 'lost' ? 0xED4245 : 0x5865F2);

    const guessLines = game.guesses.map((g, i) => {
        const digits = g.digits.join(' ');
        const feedback = `✅ ×${g.exact}  🟡 ×${g.misplaced}`;
        return `\`Guess ${i + 1}:\` **${digits}**  →  ${feedback}`;
    });

    if (guessLines.length > 0) {
        embed.addFields({ name: 'Guesses', value: guessLines.join('\n') });
    }

    const remaining = MAX_GUESSES - game.guesses.length;

    if (status === 'won') {
        embed.setDescription(`✅ You cracked the code **${game.code.join(' ')}** in **${game.guesses.length}** guess${game.guesses.length === 1 ? '' : 'es'}!`);
    } else if (status === 'lost') {
        embed.setDescription(`❌ Out of guesses. The code was **${game.code.join(' ')}**. Better luck next time!`);
    } else {
        embed.setDescription(
            `Crack the secret **3-digit code** (digits 1–6, no repeats).\n\n` +
            `✅ = right digit, right position\n` +
            `🟡 = right digit, wrong position\n\n` +
            `Use \`/minigame guess:XYZ\` to submit a guess.\n` +
            `**${remaining}** guess${remaining === 1 ? '' : 'es'} remaining.`
        );
    }

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minigame')
        .setDescription('Play Code Breaker — crack the secret 3-digit code to win money')
        .addStringOption(option =>
            option.setName('guess')
                .setDescription('Your 3-digit guess (digits 1–6, no repeats, e.g. 135)')
                .setRequired(false)),

    async execute(interaction, player) {
        const guessInput = interaction.options.getString('guess');

        // ── No guess: start or show active game ──────────────────────────────
        if (!guessInput) {
            const existing = minigameService.getGame(interaction.user.id);
            if (existing) {
                return interaction.reply({
                    embeds: [buildEmbed(existing)],
                    ephemeral: true,
                });
            }
            minigameService.startGame(interaction.user.id);
            const game = minigameService.getGame(interaction.user.id);
            return interaction.reply({
                embeds: [buildEmbed(game)],
                ephemeral: true,
            });
        }

        // ── Guess submitted ───────────────────────────────────────────────────
        const result = minigameService.submitGuess(interaction.user.id, guessInput.trim());

        if (!result.ok) {
            return interaction.reply({ content: result.message, ephemeral: true });
        }

        const { won, lost, game } = result;

        if (won) {
            const reward = minigameService.calculateReward(player, game.guesses.length);
            player.money += reward;
            await player.save();
            minigameService.endGame(interaction.user.id);

            const embed = buildEmbed(game, 'won');
            embed.addFields({ name: '💰 Reward', value: `+$${reward.toLocaleString()}` });
            return interaction.reply({ embeds: [embed] });
        }

        if (lost) {
            minigameService.endGame(interaction.user.id);
            return interaction.reply({
                embeds: [buildEmbed(game, 'lost')],
            });
        }

        // ── Game still in progress ────────────────────────────────────────────
        return interaction.reply({
            embeds: [buildEmbed(game)],
            ephemeral: true,
        });
    },
};
