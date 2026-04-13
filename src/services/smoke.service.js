const SMOKE_COST = 2000;

// Each template: { condition(p) => bool, message(p) => string }
// At runtime all matching templates are collected, one is picked at random.
// Falls back to the last entry (condition: always true) if nothing else matches.
const TEMPLATES = [
    // ── Money ────────────────────────────────────────────────────────────────
    {
        condition: p => p.money === 0,
        message: () => `You spent your last $2,000 on this. Respect. Absolutely none, but respect.`,
    },
    {
        condition: p => p.money < 500,
        message: p => `$${p.money.toFixed(0)} in the bank. Bold of you to blow $2k on vibes.`,
    },
    {
        condition: p => p.money > 500000,
        message: p => `Half a million dollars and you farm for fun. The economy is fake.`,
    },
    {
        condition: p => p.money > 1000000,
        message: p => `A millionaire. Still doing this. What are you running from?`,
    },

    // ── Prestige ─────────────────────────────────────────────────────────────
    {
        condition: p => p.prestigeCount === 0 && p.money > 150000,
        message: () => `You have enough to prestige but you haven't. Commitment issues? Therapists exist.`,
    },
    {
        condition: p => p.prestigeCount === 0,
        message: () => `Prestige 0. You're still on the tutorial. The crops can feel your hesitation.`,
    },
    {
        condition: p => p.prestigeCount === 1,
        message: () => `Prestige 1. You reset everything just to start over. That's called a metaphor.`,
    },
    {
        condition: p => p.prestigeCount >= 5,
        message: p => `Prestige ${p.prestigeCount}. You've destroyed your farm ${p.prestigeCount} times on purpose. Are you okay?`,
    },
    {
        condition: p => p.prestigeCount > 10,
        message: p => `Prestige ${p.prestigeCount}. At this point the crops have PTSD. You keep leaving and coming back.`,
    },

    // ── Farm size ─────────────────────────────────────────────────────────────
    {
        condition: p => p.farmWidth === 3 && p.farmHeight === 3,
        message: () => `Still on the default 3×3 farm. Nine whole plots. Living small, dreaming smaller.`,
    },
    {
        condition: p => p.farmHeight > 5,
        message: p => `${p.farmWidth}×${p.farmHeight} farm. You have more dirt than purpose.`,
    },

    // ── Crops ─────────────────────────────────────────────────────────────────
    {
        condition: p => p.totalCropsHarvested === 0,
        message: () => `Zero crops harvested. The soil is just decorative to you, isn't it.`,
    },
    {
        condition: p => p.totalCropsHarvested < 20,
        message: p => `${p.totalCropsHarvested} crops harvested. The plants are nervous around you.`,
    },
    {
        condition: p => p.totalCropsHarvested > 1000,
        message: p => `${p.totalCropsHarvested.toLocaleString()} crops harvested. You have a problem and it grows in soil.`,
    },
    {
        condition: p => {
            const activeCrops = p.farm.filter(plot => plot.name !== 'Empty').length;
            return activeCrops === 0;
        },
        message: () => `Empty farm. Not a single crop planted. Your land is barren, like your ambition.`,
    },
    {
        condition: p => {
            const activeCrops = p.farm.filter(plot => plot.name !== 'Empty').length;
            return activeCrops === p.farmArea;
        },
        message: () => `Every plot is filled. Type A personality detected. Please go outside.`,
    },

    // ── Resources ─────────────────────────────────────────────────────────────
    {
        condition: p => p.wood === 0 && p.stone === 0 && p.metal === 0,
        message: () => `Zero resources. Not a single log. The buildings are just decorative dreams.`,
    },
    {
        condition: p => p.wood > 50000,
        message: p => `${Math.floor(p.wood).toLocaleString()} wood. You're basically a beaver at this point.`,
    },
    {
        condition: p => p.stone > 50000,
        message: p => `${Math.floor(p.stone).toLocaleString()} stone. You're hoarding rocks. The cave era called, they want their vibe back.`,
    },
    {
        condition: p => p.metal > 50000,
        message: p => `${Math.floor(p.metal).toLocaleString()} metal. You could build a rocket. You chose farming. Respect.`,
    },

    // ── Buildings ─────────────────────────────────────────────────────────────
    {
        condition: p => p.building.every(b => b.name === 'Empty'),
        message: () => `No buildings. Just vibes and empty slots. The architects weep.`,
    },
    {
        condition: p => p.building.some(b => b.level >= 5),
        message: () => `Max level building detected. You spent resources upgrading a virtual shed. Respectable.`,
    },
    {
        condition: p => {
            const built = p.building.filter(b => b.name !== 'Empty').length;
            return built === p.buildingSlots;
        },
        message: () => `Every building slot filled. No room for growth, just like your social life.`,
    },

    // ── Achievements ──────────────────────────────────────────────────────────
    {
        condition: p => p.achievements.length === 0,
        message: () => `Zero achievements. Not even the starter one. The game tried to give you something and you refused.`,
    },
    {
        condition: p => p.achievements.length >= 10,
        message: p => `${p.achievements.length} achievements. You read the patch notes, don't you.`,
    },

    // ── Farm name ─────────────────────────────────────────────────────────────
    {
        condition: p => p.farmName === 'Farm',
        message: () => `You never renamed your farm. It's just called "Farm". You named your dog "Dog" too, didn't you.`,
    },
    {
        condition: p => p.farmName.length > 20,
        message: p => `"${p.farmName}" — you typed all that out for a farm name. Incredible commitment to a bit.`,
    },

    // ── Combo / cross-stat ────────────────────────────────────────────────────
    {
        condition: p => p.prestigeCount > 0 && p.money < 1000,
        message: p => `Prestige ${p.prestigeCount} with $${p.money.toFixed(0)} to your name. The reset hit different this time.`,
    },
    {
        condition: p => p.totalCropsHarvested > 500 && p.prestigeCount === 0,
        message: p => `${p.totalCropsHarvested} crops and still no prestige. You're a farmer, not a philosopher. Make a decision.`,
    },

    // ── Fallback (always matches) ─────────────────────────────────────────────
    {
        condition: () => true,
        message: p => `You spent $2,000 to stare at your own stats. The crops are judging you, ${p.farmName}.`,
    },
];

function getSmokeLine(player) {
    const matching = TEMPLATES.filter(t => t.condition(player));
    const pick = matching[Math.floor(Math.random() * matching.length)];
    return pick.message(player);
}

module.exports = { SMOKE_COST, getSmokeLine };
