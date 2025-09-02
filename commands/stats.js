const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');
const { Log, Ticket } = require('../database/init');
const { MessageAnalytics, VoiceAnalytics } = require('../utils/analytics/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View comprehensive bot and server statistics'),

    async execute(interaction) {
        await interaction.deferReply();

        const client = interaction.client;
        const guild = interaction.guild;

        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        const totalLogs = await Log.count({ where: { guildId: guild.id } });
        const totalTickets = await Ticket.count({ where: { guildId: guild.id } });
        const openTickets = await Ticket.count({
            where: {
                guildId: guild.id,
                status: { [require('sequelize').Op.ne]: 'closed' }
            }
        });

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const totalMessages = await MessageAnalytics.sum('messageCount', {
            where: {
                guildId: guild.id,
                createdAt: { [require('sequelize').Op.gte]: sevenDaysAgo }
            }
        }) || 0;

        const totalVoiceTime = await VoiceAnalytics.sum('duration', {
            where: {
                guildId: guild.id,
                createdAt: { [require('sequelize').Op.gte]: sevenDaysAgo }
            }
        }) || 0;

        const memUsage = process.memoryUsage();
        const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`📊 ${getServerName()} - Bot Statistics`)
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(`Comprehensive statistics and system information`)
            .addFields(
                { name: '🤖 Bot Info', value: `**Name:** ${client.user.tag}\n**Commands:** ${client.commands.size}\n**Servers:** ${client.guilds.cache.size}`, inline: true },
                { name: '⏱️ Uptime', value: `${days}d ${hours}h ${minutes}m`, inline: true },
                { name: '💾 Memory', value: `${memoryMB} MB`, inline: true },
                { name: '👥 Server Stats', value: `**Members:** ${guild.memberCount}\n**Channels:** ${guild.channels.cache.size}\n**Roles:** ${guild.roles.cache.size}`, inline: true },
                { name: '🎫 Tickets', value: `**Total:** ${totalTickets}\n**Open:** ${openTickets}`, inline: true },
                { name: '📝 Logs', value: `**Total:** ${totalLogs.toLocaleString()}`, inline: true },
                { name: '💬 Activity (7d)', value: `**Messages:** ${totalMessages.toLocaleString()}\n**Voice:** ${Math.floor(totalVoiceTime / 3600)}h`, inline: true },
                { name: '🌐 Latency', value: `**API:** ${Math.round(client.ws.ping)}ms`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `${getServerName()} • Version 2.0.0` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};