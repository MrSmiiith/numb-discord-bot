const { Events, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState, client) {
        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return;

        if (client.analytics) {
            if (oldState.channel && !newState.channel) {
                await client.analytics.collectVoiceLeave(member, oldState.channel);
            }
            else if (!oldState.channel && newState.channel) {
                await client.analytics.collectVoiceJoin(member, newState.channel);
            }
            else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                await client.analytics.collectVoiceLeave(member, oldState.channel);
                await client.analytics.collectVoiceJoin(member, newState.channel);
            }
        }

        const logChannel = member.guild.channels.cache.get(config.channels.logs.voice);
        if (!logChannel) return;

        if (oldState.channelId === newState.channelId) return;

        let embed;
        let logType;

        if (!oldState.channel && newState.channel) {
            logType = 'VOICE_JOIN';
            embed = new EmbedBuilder()
                .setColor(getEmbedColor('success'))
                .setTitle('🎤 Member Joined Voice')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'Member', value: `${member} (${member.user.tag})`, inline: true },
                    { name: 'Channel', value: `📢 ${newState.channel.name}`, inline: true },
                    { name: 'Channel ID', value: newState.channel.id, inline: true }
                )
                .setFooter({ text: `User ID: ${member.id} • ${getServerName()}` })
                .setTimestamp();
        }
        else if (oldState.channel && !newState.channel) {
            logType = 'VOICE_LEAVE';
            embed = new EmbedBuilder()
                .setColor(getEmbedColor('error'))
                .setTitle('🔇 Member Left Voice')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'Member', value: `${member} (${member.user.tag})`, inline: true },
                    { name: 'Channel', value: `📢 ${oldState.channel.name}`, inline: true },
                    { name: 'Channel ID', value: oldState.channel.id, inline: true }
                )
                .setFooter({ text: `User ID: ${member.id} • ${getServerName()}` })
                .setTimestamp();
        }
        else if (oldState.channel && newState.channel) {
            logType = 'VOICE_MOVE';
            embed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle('🔄 Member Moved Voice Channels')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'Member', value: `${member} (${member.user.tag})`, inline: true },
                    { name: 'From', value: `📢 ${oldState.channel.name}`, inline: true },
                    { name: 'To', value: `📢 ${newState.channel.name}`, inline: true }
                )
                .setFooter({ text: `User ID: ${member.id} • ${getServerName()}` })
                .setTimestamp();
        }

        if (embed && logChannel) {
            await logChannel.send({ embeds: [embed] });
        }

        if (logType) {
            await Log.create({
                guildId: member.guild.id,
                type: logType,
                userId: member.id,
                userName: member.user.tag,
                channelId: newState.channel?.id || oldState.channel?.id,
                extra: {
                    from: oldState.channel?.name,
                    to: newState.channel?.name
                }
            });
        }

        const verificationChannels = config.channels.verification.voiceChannels || [];
        if (newState.channel && verificationChannels.includes(newState.channel.id)) {
            await this.handleVerificationJoin(member, newState.channel);
        }
    },

    async handleVerificationJoin(member, channel) {
        const verifiedRole = member.guild.roles.cache.get(config.roles.verification.verified);
        if (verifiedRole && member.roles.cache.has(verifiedRole.id)) {
            return;
        }

        const alertChannel = member.guild.channels.cache.get(config.channels.verification.adminAlert);
        if (!alertChannel) return;

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('warning'))
            .setTitle('🔔 User Needs Verification!')
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`A user has joined a verification voice channel and needs to be verified.`)
            .addFields(
                { name: '👤 User', value: `${member} (${member.user.tag})`, inline: true },
                { name: '🔊 Channel', value: channel.name, inline: true },
                { name: '📅 Account Age', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `${getServerName()} • Please verify this user` })
            .setTimestamp();

        const adminRole = member.guild.roles.cache.get(config.roles.staff.admin);
        const content = config.features.verificationAlertMentions && adminRole ? `<@&${adminRole.id}>` : null;

        await alertChannel.send({ content, embeds: [embed] });
    }
};