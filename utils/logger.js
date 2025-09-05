const { EmbedBuilder } = require('discord.js');
const { Log, VoiceLog } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

async function logEvent(guild, type, data) {
    try {
        await Log.create({
            guildId: guild.id,
            type: type,
            userId: data.targetId || data.target?.id || null,
            moderatorId: data.moderator?.id || null,
            channelId: data.channelId || null,
            messageId: data.messageId || null,
            messageContent: data.messageContent || null,
            oldContent: data.oldContent || null,
            newContent: data.newContent || null,
            reason: data.reason || null,
            extra: data
        });
    } catch (error) {
        console.error('Failed to save log to database:', error);
    }

    const logChannel = guild.channels.cache.get(config.channels.logs.general);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTimestamp()
        .setFooter({ text: `${getServerName()} • Log ID: ${Date.now()}` });
    switch(type) {
        case 'MUTE':
            embed.setColor(getEmbedColor('mute'))
                .setTitle(`🔇 ${getServerName()} - User Muted`)
                .addFields(
                    { name: 'User', value: data.target, inline: true },
                    { name: 'Moderator', value: data.moderator, inline: true },
                    { name: 'Reason', value: data.reason, inline: false }
                );
            break;

        case 'UNMUTE':
            embed.setColor(getEmbedColor('success'))
                .setTitle(`🔊 ${getServerName()} - User Unmuted`)
                .addFields(
                    { name: 'User', value: data.target, inline: true },
                    { name: 'Moderator', value: data.moderator, inline: true },
                    { name: 'Reason', value: data.reason, inline: false }
                );
            break;

        case 'BAN':
            embed.setColor(getEmbedColor('ban'))
                .setTitle(`🔨 ${getServerName()} - User Banned`)
                .addFields(
                    { name: 'User', value: data.target, inline: true },
                    { name: 'Moderator', value: data.moderator, inline: true },
                    { name: 'Reason', value: data.reason, inline: false },
                    { name: 'Message Delete Days', value: data.messageDeleteDays?.toString() || '0', inline: true }
                );            break;

        case 'UNBAN':
            embed.setColor(getEmbedColor('success'))
                .setTitle(`✅ ${getServerName()} - User Unbanned`)
                .addFields(
                    { name: 'User ID', value: data.targetId, inline: true },
                    { name: 'Moderator', value: data.moderator, inline: true },
                    { name: 'Reason', value: data.reason, inline: false }
                );
            break;

        case 'KICK':
            embed.setColor(getEmbedColor('kick'))
                .setTitle(`👢 ${getServerName()} - User Kicked`)
                .addFields(
                    { name: 'User', value: data.target, inline: true },
                    { name: 'Moderator', value: data.moderator, inline: true },
                    { name: 'Reason', value: data.reason, inline: false }
                );
            break;

        case 'TIMEOUT':
            embed.setColor(getEmbedColor('mute'))
                .setTitle(`⏰ ${getServerName()} - User Timed Out`)
                .addFields(
                    { name: 'User', value: data.target, inline: true },
                    { name: 'Moderator', value: data.moderator, inline: true },
                    { name: 'Duration', value: data.duration, inline: true },
                    { name: 'Reason', value: data.reason, inline: false }
                );            break;

        case 'MESSAGE_DELETE':
            embed.setColor(getEmbedColor('error'))
                .setTitle(`🗑️ ${getServerName()} - Message Deleted`)
                .addFields(
                    { name: 'Author', value: data.author || 'Unknown', inline: true },
                    { name: 'Channel', value: `<#${data.channelId}>`, inline: true },
                    { name: 'Content', value: data.messageContent || 'No content', inline: false }
                );
            break;

        case 'MESSAGE_EDIT':
            embed.setColor(getEmbedColor('info'))
                .setTitle(`✏️ ${getServerName()} - Message Edited`)
                .addFields(
                    { name: 'Author', value: data.author, inline: true },
                    { name: 'Channel', value: `<#${data.channelId}>`, inline: true },
                    { name: 'Old Content', value: data.oldContent || 'No content', inline: false },
                    { name: 'New Content', value: data.newContent || 'No content', inline: false }
                );
            break;

        case 'VERIFY':
            embed.setColor(getEmbedColor('verify'))
                .setTitle(`✅ ${getServerName()} - User Verified`)
                .addFields(
                    { name: 'User', value: data.target, inline: true },
                    { name: 'Verified by', value: data.moderator, inline: true },
                    { name: 'Gender', value: data.gender, inline: true }
                );            break;

        case 'VERIFICATION_REJECTED':
            embed.setColor(getEmbedColor('error'))
                .setTitle(`🚫 ${getServerName()} - Verification Rejected`)
                .addFields(
                    { name: 'User', value: data.target, inline: true },
                    { name: 'Rejected by', value: data.moderator, inline: true }
                );
            break;

        case 'MEMBER_JOIN':
            embed.setColor(getEmbedColor('success'))
                .setTitle(`📥 ${getServerName()} - Member Joined`)
                .addFields(
                    { name: 'User', value: data.user, inline: true },
                    { name: 'Account Created', value: data.accountCreated, inline: true }
                );
            break;

        case 'MEMBER_LEAVE':
            embed.setColor(getEmbedColor('error'))
                .setTitle(`📤 ${getServerName()} - Member Left`)
                .addFields(
                    { name: 'User', value: data.user, inline: true },
                    { name: 'Roles', value: data.roles || 'None', inline: false }
                );
            break;

        default:
            embed.setColor(getEmbedColor('default'))
                .setTitle(`📝 ${getServerName()} - Event Log`)
                .setDescription(`Type: ${type}`)
                .addFields(
                    { name: 'Data', value: JSON.stringify(data, null, 2).substring(0, 1024), inline: false }
                );
    }
    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Failed to send log to channel:', error);
    }
}

async function logVoiceEvent(guild, userId, action, data) {
    try {
        await VoiceLog.create({
            guildId: guild.id,
            userId: userId,
            action: action,
            channelId: data.channelId || null,
            oldChannelId: data.oldChannelId || null,
            newChannelId: data.newChannelId || null
        });
    } catch (error) {
        console.error('Failed to save voice log to database:', error);
    }

    const voiceLogChannel = guild.channels.cache.get(config.channels.logs.voice);
    if (!voiceLogChannel) return;

    const member = guild.members.cache.get(userId);
    const embed = new EmbedBuilder()
        .setTimestamp()
        .setFooter({ text: `${getServerName()} • User ID: ${userId}` });
    switch(action) {
        case 'join':
            embed.setColor(getEmbedColor('success'))
                .setTitle(`🎤 ${getServerName()} - Voice Channel Join`)
                .setDescription(`**${member?.user.tag || 'Unknown User'}** joined <#${data.channelId}>`);
            break;

        case 'leave':
            embed.setColor(getEmbedColor('error'))
                .setTitle(`🔇 ${getServerName()} - Voice Channel Leave`)
                .setDescription(`**${member?.user.tag || 'Unknown User'}** left <#${data.channelId}>`);
            break;

        case 'move':
            embed.setColor(getEmbedColor('info'))
                .setTitle(`🔄 ${getServerName()} - Voice Channel Move`)
                .setDescription(`**${member?.user.tag || 'Unknown User'}** moved from <#${data.oldChannelId}> to <#${data.newChannelId}>`);
            break;
    }

    try {
        await voiceLogChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Failed to send voice log to channel:', error);
    }
}

module.exports = { logEvent, logVoiceEvent };