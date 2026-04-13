const {
    MINIGAME_MIN_REWARD,
    MINIGAME_MAX_BASE,
    MINIGAME_PRESTIGE_SCALE,
    MINIGAME_MULTIPLIERS,
} = require('../constants.js');

// userId -> { code: [1,3,5], guesses: [{ digits, exact, misplaced }] }
const activeGames = new Map();

function generateCode() {
    const pool = [1, 2, 3, 4, 5, 6];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
}

function evaluateGuess(code, guess) {
    let exact = 0;
    let misplaced = 0;
    for (let i = 0; i < 3; i++) {
        if (guess[i] === code[i]) {
            exact++;
        } else if (code.includes(guess[i])) {
            misplaced++;
        }
    }
    return { exact, misplaced };
}

function calculateReward(player, guessesUsed) {
    const prestige = player.prestigeCount || 0;
    const cap = MINIGAME_MAX_BASE * Math.pow(MINIGAME_PRESTIGE_SCALE, prestige);
    const base = Math.max(MINIGAME_MIN_REWARD, Math.min(player.money * 0.10, cap));
    const multiplier = MINIGAME_MULTIPLIERS[guessesUsed - 1];
    return Math.floor(base * multiplier);
}

function startGame(userId) {
    activeGames.set(userId, { code: generateCode(), guesses: [] });
}

function getGame(userId) {
    return activeGames.get(userId) || null;
}

function endGame(userId) {
    activeGames.delete(userId);
}

/**
 * Submit a guess for an active game.
 * @returns {{ ok: boolean, message?: string, won?: boolean, lost?: boolean, game?: object }}
 */
function submitGuess(userId, guessStr) {
    const game = activeGames.get(userId);
    if (!game) {
        return { ok: false, message: 'No active game. Use `/minigame` to start one.' };
    }

    if (!/^[1-6]{3}$/.test(guessStr)) {
        return { ok: false, message: 'Invalid guess. Enter exactly 3 digits, each between 1 and 6 (e.g. `135`).' };
    }

    const digits = guessStr.split('').map(Number);
    if (new Set(digits).size !== 3) {
        return { ok: false, message: 'No repeated digits — each digit in the code is unique.' };
    }

    const result = evaluateGuess(game.code, digits);
    game.guesses.push({ digits, ...result });

    const won = result.exact === 3;
    const lost = !won && game.guesses.length >= 6;

    return { ok: true, won, lost, result, game };
}

module.exports = { startGame, getGame, endGame, submitGuess, calculateReward };
