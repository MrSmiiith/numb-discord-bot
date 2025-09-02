const { Events, ActivityType } = require('discord.js');
const { verifyRoles } = require('../utils/roleSetup');
const MuteManager = require('../utils/muteManager');
const AnalyticsCollector = require('../utils/analytics/collector');
const { initAnalytics } = require('../utils/analytics/database');
const { initGiveaways } = require('../utils/giveawayDatabase');
const GiveawayManager = require('../utils/giveawayManager');
const { cacheInvites } = require('./guildMemberAdd');
const ConsoleUI = require('../utils/consoleUI');
const config = require('../config');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const ui = new ConsoleUI();
        client.ui = ui;

        ui.displayBanner();
        ui.displayInfo(client);

        ui.registerModule('Bot Activity', 'setting');
        client.user.setActivity('the community | /help', { type: ActivityType.Watching });
        ui.updateModule('Bot Activity', 'ready', '✅');

        ui.registerModule('Analytics System', 'initializing', '📊');
        await initAnalytics();
        client.analytics = new AnalyticsCollector(client);
        ui.updateModule('Analytics System', 'ready', '📊');

        ui.registerModule('Giveaway System', 'initializing', '🎉');
        await initGiveaways();
        client.giveawayManager = new GiveawayManager(client);
        client.giveawayManager.start();
        ui.updateModule('Giveaway System', 'ready', '🎉');

        ui.registerModule('Invite Tracker', 'caching', '📋');
        await cacheInvites(client);
        ui.updateModule('Invite Tracker', 'ready', '📋');

        ui.registerModule('Mute Manager', 'starting', '🔇');
        const muteManager = new MuteManager(client);
        muteManager.start();
        ui.updateModule('Mute Manager', 'ready', '🔇');

        ui.registerModule('Role Verification', 'checking', '🎭');
        let allRolesValid = true;
        for (const guild of client.guilds.cache.values()) {
            const rolesValid = await verifyRoles(guild);
            if (!rolesValid) {
                allRolesValid = false;
                ui.log('warning', `Missing roles in ${guild.name}`);
            }
        }
        ui.updateModule('Role Verification', allRolesValid ? 'ready' : 'warning', allRolesValid ? '✅' : '⚠️');
        ui.registerModule('Confession System', 'ready', '🤫');
        ui.registerModule('Fun Commands', 'ready', '🎮');
        ui.registerModule('Reaction Roles', 'ready', '🎭');
        ui.registerModule('Ticket System', 'ready', '🎫');
        ui.registerModule('Verification System', 'ready', '✅');
        ui.registerModule('Auto-Moderation', 'ready', '🛡️');
        ui.registerModule('Database', 'ready', '💾');

        ui.showCommands(client.commands);

        ui.displayStats();

        ui.displayReady(client);

        ui.log('info', `Server Name: ${config.branding.serverName}`);
        ui.log('info', `Theme Color: ${config.branding.embedColor}`);
        ui.log('success', 'All systems operational!');
    },
};