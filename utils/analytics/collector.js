const { MessageAnalytics, VoiceAnalytics, MemberFlow, ChannelActivity } = require('./database');

class AnalyticsCollector {
    constructor(client) {
        this.client = client;
        this.voiceSessions = new Map();
    }

    async collectMessage(message) {
        if (!message.guild || message.author.bot) return;

        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        const date = now.toISOString().split('T')[0];

        const wordCount = message.content.split(/\s+/).filter(word => word.length > 0).length;
        const characterCount = message.content.length;

        try {
            const existing = await MessageAnalytics.findOne({
                where: {
                    guildId: message.guild.id,
                    channelId: message.channel.id,
                    userId: message.author.id,
                    hour: hour,
                    date: date
                }
            });

            if (existing) {
                existing.messageCount += 1;
                existing.wordCount += wordCount;
                existing.characterCount += characterCount;
                await existing.save();
            } else {
                await MessageAnalytics.create({
                    guildId: message.guild.id,
                    channelId: message.channel.id,
                    channelName: message.channel.name,
                    userId: message.author.id,
                    userName: message.author.tag,
                    messageCount: 1,
                    wordCount: wordCount,
                    characterCount: characterCount,
                    hour: hour,
                    dayOfWeek: dayOfWeek,
                    date: date
                });
            }

            await this.updateChannelActivity(message.channel, 'text', date);
        } catch (error) {
            console.error('Error collecting message analytics:', error);
        }
    }
    async collectVoiceJoin(member, channel) {
        const sessionId = `${member.id}-${channel.id}`;
        const now = new Date();

        this.voiceSessions.set(sessionId, {
            guildId: member.guild.id,
            channelId: channel.id,
            userId: member.id,
            joinTime: now,
            date: now.toISOString().split('T')[0]
        });
    }

    async collectVoiceLeave(member, channel) {
        const sessionId = `${member.id}-${channel.id}`;
        const session = this.voiceSessions.get(sessionId);

        if (session) {
            const now = new Date();
            const duration = Math.floor((now - session.joinTime) / 1000);

            try {
                await VoiceAnalytics.create({
                    guildId: session.guildId,
                    channelId: session.channelId,
                    userId: session.userId,
                    duration: duration,
                    joinTime: session.joinTime,
                    leaveTime: now,
                    date: session.date
                });

                await this.updateChannelActivity(channel, 'voice', session.date);
            } catch (error) {
                console.error('Error collecting voice analytics:', error);
            }

            this.voiceSessions.delete(sessionId);
        }
    }

    async collectMemberFlow(member, action, inviteData = null, riskScore = null) {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        const date = now.toISOString().split('T')[0];
        const accountAge = Math.floor((now - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));

        try {
            await MemberFlow.create({
                guildId: member.guild.id,
                action: action,
                userId: member.id,
                userName: member.user.tag,
                inviterId: inviteData?.inviter?.id || null,
                inviteCode: inviteData?.code || null,
                accountAge: accountAge,
                riskScore: riskScore,
                hour: hour,
                dayOfWeek: dayOfWeek,
                date: date
            });
        } catch (error) {
            console.error('Error collecting member flow:', error);
        }
    }
    async updateChannelActivity(channel, type, date) {
        try {
            const existing = await ChannelActivity.findOne({
                where: {
                    guildId: channel.guild.id,
                    channelId: channel.id,
                    date: date
                }
            });

            if (existing) {
                existing.messageCount += 1;
                await existing.save();
            } else {
                await ChannelActivity.create({
                    guildId: channel.guild.id,
                    channelId: channel.id,
                    channelName: channel.name,
                    channelType: type,
                    messageCount: 1,
                    uniqueUsers: 1,
                    date: date
                });
            }
        } catch (error) {
            console.error('Error updating channel activity:', error);
        }
    }

    async detectRaidPattern(guildId) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        try {
            const recentJoins = await MemberFlow.count({
                where: {
                    guildId: guildId,
                    action: 'join',
                    createdAt: { [require('sequelize').Op.gte]: fiveMinutesAgo }
                }
            });

            const highRiskJoins = await MemberFlow.count({
                where: {
                    guildId: guildId,
                    action: 'join',
                    riskScore: { [require('sequelize').Op.gte]: 60 },
                    createdAt: { [require('sequelize').Op.gte]: fiveMinutesAgo }
                }
            });

            if (recentJoins >= 10) return { raid: true, severity: 'high', joins: recentJoins };
            if (recentJoins >= 5 && highRiskJoins >= 3) return { raid: true, severity: 'medium', joins: recentJoins };
            if (recentJoins >= 3 && highRiskJoins >= 2) return { raid: true, severity: 'low', joins: recentJoins };

            return { raid: false };
        } catch (error) {
            console.error('Error detecting raid pattern:', error);
            return { raid: false };
        }
    }
}

module.exports = AnalyticsCollector;