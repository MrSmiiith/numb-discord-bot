const { Events } = require('discord.js');
const { Ticket, TicketMessage } = require('../database/init');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        const ticket = await Ticket.findOne({
            where: {
                channelId: message.channel.id,
                status: { [require('sequelize').Op.ne]: 'closed' }
            }
        });

        if (!ticket) return;

        const attachments = message.attachments.map(a => a.url);

        await TicketMessage.create({
            ticketId: ticket.ticketId,
            userId: message.author.id,
            userName: message.author.tag,
            content: message.content || '[No text content]',
            attachments: attachments.length > 0 ? attachments : null
        });

        ticket.messageCount = (ticket.messageCount || 0) + 1;
        ticket.lastActivity = new Date();
        await ticket.save();
    }
};