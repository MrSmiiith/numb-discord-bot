const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (!message.guild) return;

        const config = client.config;

        if (!config.features.autoReactions || !config.autoReactions.enabled) return;

        const channelConfig = config.autoReactions.channels.find(
            ch => ch.channelId === message.channel.id
        );

        if (!channelConfig) return;

        const isBot = message.author.bot;

        if (isBot && !channelConfig.reactToBot) return;
        if (!isBot && !channelConfig.reactToUsers) return;

        if (channelConfig.keywords && channelConfig.keywords.length > 0) {
            const messageContent = message.content.toLowerCase();
            const hasKeyword = channelConfig.keywords.some(keyword =>
                messageContent.includes(keyword.toLowerCase())
            );

            if (!hasKeyword) return;
        }
        for (const reaction of channelConfig.reactions) {
            try {
                await message.react(reaction);
                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (error) {
                console.error(`Failed to add reaction ${reaction} to message ${message.id}:`, error);
                continue;
            }
        }

        if (config.features.logBotMessages) {
            console.log(`Auto-reacted to message in #${message.channel.name} with ${channelConfig.reactions.length} reactions`);
        }
    },
};