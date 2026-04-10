// Achievement service — unlock and format achievement notifications

const achievementList = require('../../data/achievements.json');

/**
 * Tries to unlock an achievement for a player.
 * Returns the achievement object if newly unlocked, null if already owned or not found.
 * NOTE: Does NOT save the player — caller must save after collecting all unlocks.
 */
function tryUnlock(player, name) {
    if (player.achievements.some(a => a.name === name)) return null;
    const achievement = achievementList.find(a => a.name === name);
    if (!achievement) return null;
    player.achievements.push({ name, unlockedAt: new Date() });
    return achievement;
}

/**
 * Formats a list of newly unlocked achievements into a message suffix.
 */
function formatUnlocked(achievements) {
    if (!achievements.length) return '';
    const label = achievements.length > 1 ? 'Achievements Unlocked!' : 'Achievement Unlocked!';
    return '\n\n🏆 **' + label + '**\n' +
        achievements.map(a => `${a.icon} **${a.name}** — ${a.description}`).join('\n');
}

module.exports = { tryUnlock, formatUnlocked };
