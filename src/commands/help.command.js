const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { version } = require('../../package.json');

function buildPages(version) {
    return [
        // Page 1 — Commands
        new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Dodo's Weed Farm V ${version}`)
            .setURL('https://github.com/SenYanHo/discord-farm-game')
            .setDescription('You plant crops, wait for them to grow, harvest for money, and keep scaling up. Use the buttons below to learn more.')
            .addFields(
                { name: '/list',         value: 'List prices of crops, buildings, upgrades, and contracts' },
                { name: '/farm',         value: 'Shows your current farm plot' },
                { name: '/visit',        value: "Visit someone else's plot" },
                { name: '/plantall',     value: 'Plant as many crops as possible' },
                { name: '/check',        value: 'Check when a crop is mature' },
                { name: '/harvest',      value: 'Harvest all mature crops and sell them' },
                { name: '/upgrade',      value: 'Upgrade your farm width or building slots' },
                { name: '/build',        value: 'Build or upgrade a building at a slot' },
                { name: '/checkbuild',   value: 'Check what building is at a slot' },
                { name: '/destroy',      value: 'Destroy a building and get some cost back' },
                { name: '/buy',          value: 'Buy building resources with money' },
                { name: '/give',         value: 'Give resources to another player' },
                { name: '/list contracts', value: 'Browse contracts posted by other players' },
                { name: '/makecontract', value: 'Post a contract to sell your resources' },
                { name: '/buycontract',  value: 'Buy from a posted contract' },
                { name: '/leaderboard',  value: 'Show the top 5 richest players' },
                { name: '/rename',       value: 'Rename your farm' },
                { name: '/prestige',     value: 'Start a prestige race' },
                { name: '/race',         value: 'Check current race progress' },
                { name: '/achievements', value: 'View your achievements' },
                { name: '/setchannel',   value: '(Admin) Set the welcome message channel' }
            )
            .setFooter({ text: 'Page 1/4 — Commands' }),

        // Page 2 — Tradeoffs
        new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('⚖️ Game Tradeoffs')
            .setDescription('Every decision in this game involves a tradeoff. Here are the big ones.')
            .addFields(
                {
                    name: '🌱 Fast Crops vs Slow Crops',
                    value: 'Fast crops (e.g. Carrot at 40s) give tiny returns but you can harvest many times per hour. Slow crops (e.g. Super Silver Haze at ~42 min) give large returns per harvest but require patience. **At early game, fast crops scale better. Late game, slow crops have higher income per click.**'
                },
                {
                    name: '🪵 Specialize vs Diversify Buildings',
                    value: 'Each building type has a **synergy bonus** when you own multiples:\n• 1× = no bonus\n• 2× = 1.4× production\n• 3× = 2× production\n• 4× = 2.3× production\n\nSpecializing in one resource type gives huge output. But if you need a variety of resources for upgrades, diversifying may be necessary.'
                },
                {
                    name: '🏗️ Expand Farm vs Buy Buildings',
                    value: 'Farm width upgrades cost money **and** all three resources — but give you more plots to plant. Building slots let you produce more resources passively. **Expand farm if crops are your income source. Build more if you want passive resource income to fund future upgrades.**'
                },
                {
                    name: '🤝 Trade vs Self-Sufficient',
                    value: "You can buy resources from the market or farm them yourself. Buying is fast but costs money. Farming them is slow but free. **If your server has active traders, it's often cheaper to buy resources from contracts than to build a Recycling Shop yourself.**"
                },
                {
                    name: '💎 Prestige Timing',
                    value: 'Prestiging resets your farm but grants a permanent **×1.15 income multiplier** per prestige level. The race target doubles every prestige, so it gets harder. **Prestige early for quick gains, or grind longer for a more powerful reset.**'
                }
            )
            .setFooter({ text: 'Page 2/4 — Tradeoffs' }),

        // Page 3 — Buildings & Resources
        new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🏭 Buildings & Resources')
            .setDescription('Resources (wood 🪵, stone 🪨, metal 🔧) are needed for upgrades and buildings. They are produced passively by your buildings every hour.')
            .addFields(
                {
                    name: '🪵 Lumber Mill',
                    value: 'Produces **wood** per hour. Wood is the most commonly used resource — needed for almost every upgrade and building tier.'
                },
                {
                    name: '🪨 Stone Quarry',
                    value: 'Produces **stone** per hour. Stone is used in mid-to-high tier upgrades and buildings.'
                },
                {
                    name: '🔧 Recycling Shop',
                    value: 'Produces **metal** per hour. Metal is the rarest and most expensive resource — required for high-end upgrades.'
                },
                {
                    name: '🌾 Extra Plots',
                    value: 'Increases your farm **height** by 1 per level. More plots = more crops planted per cycle = higher income.'
                },
                {
                    name: '📦 How Resources are Used',
                    value: '• Upgrading **farm width** (more columns of crops)\n• Expanding **building slots** (more buildings)\n• Building and **upgrading** any building to higher levels\n• Initiating a **prestige race**'
                },
                {
                    name: '💡 Tips',
                    value: '• Resources accumulate while you\'re offline — check in regularly to stay close to capacity\n• Use `/buy` to purchase resources with money if you\'re short\n• Post resources on `/makecontract` to earn money from other players\n• Specialising in one resource type gives a big synergy bonus (up to 2.3×)'
                }
            )
            .setFooter({ text: 'Page 3/4 — Buildings & Resources' }),

        // Page 4 — Prestige & Race
        new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('💎 Prestige & The Harvest Race')
            .setDescription('Prestige is the endgame system. It resets your farm in exchange for a **permanent income multiplier** that stacks every time you do it.')
            .addFields(
                {
                    name: '✨ What Prestige Does',
                    value: '• Resets your money, farm, buildings, and resources back to the start\n• Grants your account a permanent **×1.15 income multiplier** (stacks multiplicatively)\n• **Does NOT reset** your achievements or total crops harvested\n\nExample: After 3 prestiges your crops are worth ×1.15³ = **×1.52** their base value.'
                },
                {
                    name: '🏁 How to Start a Race',
                    value: '1. Accumulate **$500,000 + 100,000 of each resource**\n2. Use `/prestige` to spend those resources and start the race\n3. The **entire server** has **1 hour** to collectively harvest a target number of crops\n4. If the target is reached (or the timer runs out with enough crops), you **prestige successfully**\n5. If the timer runs out and the target wasn\'t reached, you fail and get **30% of the cost refunded** — with a 1-hour cooldown before anyone can try again'
                },
                {
                    name: '📈 Race Targets (doubles each prestige)',
                    value: '• 1st prestige: **250 crops**\n• 2nd prestige: **500 crops**\n• 3rd prestige: **1,000 crops**\n• 4th prestige: **2,000 crops**\n• (doubles every time)'
                },
                {
                    name: '🤝 The Race is Cooperative',
                    value: 'Every player on the server who harvests during an active race contributes to the crop count. Getting your whole server to `/harvest` at once is the fastest way to finish.'
                },
                {
                    name: '📊 Tracking Progress',
                    value: 'Use `/race` to see live progress: crops harvested, target, percentage, and time remaining.'
                }
            )
            .setFooter({ text: 'Page 4/4 — Prestige & Race' }),
    ];
}

function buildRow(page, total) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('help_prev')
            .setLabel('◀ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId('help_next')
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === total - 1)
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Instructions on the Game'),
    async execute(interaction, player) {
        const pages = buildPages(version);
        let page = 0;

        const reply = await interaction.reply({
            embeds: [pages[page]],
            components: [buildRow(page, pages.length)],
            ephemeral: true
        });

        const collector = reply.createMessageComponentCollector({ time: 5 * 60 * 1000 });

        collector.on('collect', async btn => {
            if (btn.user.id !== interaction.user.id) {
                await btn.reply({ content: 'This menu is not for you.', ephemeral: true });
                return;
            }

            if (btn.customId === 'help_prev') page = Math.max(0, page - 1);
            if (btn.customId === 'help_next') page = Math.min(pages.length - 1, page + 1);

            await btn.update({
                embeds: [pages[page]],
                components: [buildRow(page, pages.length)]
            });
        });

        collector.on('end', async () => {
            await interaction.editReply({ components: [] }).catch(() => {});
        });
    },
};
