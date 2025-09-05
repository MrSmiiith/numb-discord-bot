const config = require('./config');
const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./database/init');
const { logEvent } = require('./utils/logger');
const ConsoleUI = require('./utils/consoleUI');

// Prevent bot crashes from unhandled errors
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

const ui = new ConsoleUI();
ui.displayBanner();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER'],
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.config = config;
client.ui = ui;

ui.registerModule('Commands', 'loading', '📂');
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}
ui.updateModule('Commands', `loaded ${client.commands.size} commands`, '✅');
ui.registerModule('Events', 'loading', '📅');
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
let eventCount = 0;

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
    eventCount++;
}
ui.updateModule('Events', `loaded ${eventCount} events`, '✅');

ui.registerModule('Slash Commands', 'registering', '🔧');
const commands = [];
client.commands.forEach(command => {
    commands.push(command.data.toJSON());
});

const rest = new REST({ version: '10' }).setToken(config.bot.token);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(config.bot.clientId, config.bot.guildId),
            { body: commands },
        );
        ui.updateModule('Slash Commands', 'registered', '✅');
    } catch (error) {
        ui.updateModule('Slash Commands', 'error', '❌');
        ui.log('error', `Failed to register commands: ${error.message}`);
    }
})();

ui.registerModule('Database', 'initializing', '💾');
initDatabase().then(() => {
    ui.updateModule('Database', 'connected', '✅');
}).catch(error => {
    ui.updateModule('Database', 'error', '❌');
    ui.log('error', `Database error: ${error.message}`);
});

ui.registerModule('Discord Login', 'connecting', '🔐');
client.login(config.bot.token).then(() => {
    ui.updateModule('Discord Login', 'connected', '✅');
}).catch(error => {
    ui.updateModule('Discord Login', 'error', '❌');
    ui.log('error', `Login failed: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', error => {
    ui.log('error', `Unhandled promise rejection: ${error.message}`);
});

process.on('SIGINT', () => {
    ui.log('info', 'Shutting down gracefully...');
    client.destroy();
    process.exit(0);
});