const { Events } = require('discord.js');
const { logEvent } = require('../utils/logger');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        if (!message.guild) return;

        if (message.author?.bot) return;

        await logEvent(message.guild, 'MESSAGE_DELETE', {
            author: message.author?.tag || 'Unknown',
            channelId: message.channel.id,
            messageContent: message.content || 'No content',
            messageId: message.id
        });
    },
};