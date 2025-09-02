const { Events } = require('discord.js');
const { logEvent } = require('../utils/logger');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        if (!newMessage.guild) return;

        if (newMessage.author?.bot) return;

        if (oldMessage.content === newMessage.content) return;

        await logEvent(newMessage.guild, 'MESSAGE_EDIT', {
            author: newMessage.author.tag,
            channelId: newMessage.channel.id,
            messageId: newMessage.id,
            oldContent: oldMessage.content || 'No content',
            newContent: newMessage.content || 'No content'
        });
    },
};