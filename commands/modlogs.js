const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlogs')
        .setDescription('View moderation logs for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check logs')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of logs to show')
                .setRequired(false)
                .addChoices(
                    { name: 'All', value: 'all' },
                    { name: 'Warnings', value: 'WARNING' },
                    { name: 'Mutes', value: 'MUTE' },
                    { name: 'Bans', value: 'BAN' },
                    { name: 'Kicks', value: 'KICK' },
                    { name: 'Timeouts', value: 'TIMEOUT' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const target = interaction.options.getUser('user');
        const logType = interaction.options.getString('type') || 'all';
        
        const where = {
            guildId: interaction.guild.id,
            userId: target.id
        };
        
        if (logType !== 'all') {
            where.type = logType;
        } else {
            where.type = ['WARNING', 'MUTE', 'TEMP_MUTE', 'BAN', 'KICK', 'TIMEOUT', 'UNMUTE', 'UNBAN'];
        }        
        const logs = await Log.findAll({
            where: where,
            order: [['createdAt', 'DESC']],
            limit: 15
        });
        
        if (logs.length === 0) {
            return interaction.editReply({
                content: `✅ No moderation logs found for ${target.tag}`,
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`📋 Moderation Logs - ${target.tag}`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(`Showing ${logs.length} most recent ${logType === 'all' ? 'actions' : logType.toLowerCase()}`)
            .setFooter({ text: `${getServerName()} • Total logs: ${logs.length}` })
            .setTimestamp();
        
        const typeEmojis = {
            'WARNING': '⚠️',
            'MUTE': '🔇',
            'TEMP_MUTE': '⏱️',
            'UNMUTE': '🔊',
            'BAN': '🔨',
            'UNBAN': '✅',
            'KICK': '👢',
            'TIMEOUT': '⏰'
        };
        
        logs.forEach(log => {
            const date = new Date(log.createdAt);
            const emoji = typeEmojis[log.type] || '📝';
            
            let value = `**Moderator:** ${log.moderatorName || 'System'}\n`;
            value += `**Date:** ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
            if (log.reason) value += `**Reason:** ${log.reason}\n`;
            if (log.duration) value += `**Duration:** ${log.duration}\n`;
            
            embed.addFields({
                name: `${emoji} ${log.type}`,
                value: value,
                inline: false
            });
        });
        
        await interaction.editReply({ embeds: [embed] });
    }
};