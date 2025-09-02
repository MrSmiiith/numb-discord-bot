const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { MessageAnalytics, VoiceAnalytics, MemberFlow, ChannelActivity } = require('../utils/analytics/database');
const { getEmbedColor, getServerName } = require('../utils/branding');
const { createCanvas } = require('canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('View advanced server analytics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('overview')
                .setDescription('General analytics overview'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('activity')
                .setDescription('Server activity heatmap'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('channels')
                .setDescription('Channel usage statistics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('members')
                .setDescription('Member engagement analysis'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('growth')
                .setDescription('Member growth tracking'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('raid')
                .setDescription('Check for raid patterns'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        switch(subcommand) {
            case 'overview':
                await this.showOverview(interaction);
                break;
            case 'activity':
                await this.showActivityHeatmap(interaction);
                break;
            case 'channels':
                await this.showChannelStats(interaction);
                break;
            case 'members':
                await this.showMemberEngagement(interaction);
                break;
            case 'growth':
                await this.showGrowthTracking(interaction);
                break;
            case 'raid':
                await this.checkRaidPattern(interaction);
                break;
        }
    },
    async showOverview(interaction) {
        const guildId = interaction.guild.id;
        const now = new Date();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const totalMessages = await MessageAnalytics.sum('messageCount', {
            where: {
                guildId: guildId,
                createdAt: { [require('sequelize').Op.gte]: sevenDaysAgo }
            }
        }) || 0;

        const uniqueUsers = await MessageAnalytics.count({
            where: { guildId: guildId },
            distinct: true,
            col: 'userId'
        });

        const totalVoiceTime = await VoiceAnalytics.sum('duration', {
            where: {
                guildId: guildId,
                createdAt: { [require('sequelize').Op.gte]: sevenDaysAgo }
            }
        }) || 0;

        const joins = await MemberFlow.count({
            where: {
                guildId: guildId,
                action: 'join',
                createdAt: { [require('sequelize').Op.gte]: sevenDaysAgo }
            }
        });

        const leaves = await MemberFlow.count({
            where: {
                guildId: guildId,
                action: 'leave',
                createdAt: { [require('sequelize').Op.gte]: sevenDaysAgo }
            }
        });

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`📊 ${getServerName()} - Analytics Overview`)
            .setDescription('Server statistics for the last 7 days')
            .addFields(
                { name: '💬 Messages', value: `${totalMessages.toLocaleString()} messages\n${uniqueUsers} active users`, inline: true },
                { name: '🎤 Voice', value: `${Math.floor(totalVoiceTime / 3600)} hours\n${Math.floor(totalVoiceTime / uniqueUsers / 60)} min/user avg`, inline: true },
                { name: '👥 Member Flow', value: `+${joins} joined\n-${leaves} left\n${joins - leaves > 0 ? '+' : ''}${joins - leaves} net`, inline: true },
                { name: '📈 Daily Average', value: `${Math.floor(totalMessages / 7)} messages/day\n${Math.floor(totalVoiceTime / 7 / 3600)} voice hours/day`, inline: true },
                { name: '🏆 Activity Score', value: this.calculateActivityScore(totalMessages, totalVoiceTime, uniqueUsers), inline: true },
                { name: '📅 Period', value: `Last 7 days\n${sevenDaysAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`, inline: true }
            )
            .setFooter({ text: getServerName() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
    async showActivityHeatmap(interaction) {
        const guildId = interaction.guild.id;

        const messageData = await MessageAnalytics.findAll({
            where: { guildId: guildId },
            attributes: [
                'hour',
                'dayOfWeek',
                [require('sequelize').fn('SUM', require('sequelize').col('messageCount')), 'total']
            ],
            group: ['hour', 'dayOfWeek']
        });

        const heatmap = Array(7).fill().map(() => Array(24).fill(0));
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        messageData.forEach(data => {
            const day = data.dayOfWeek;
            const hour = data.hour;
            const count = parseInt(data.dataValues.total);
            heatmap[day][hour] = count;
        });

        let maxActivity = 0;
        let peakDay = 0;
        let peakHour = 0;

        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h++) {
                if (heatmap[d][h] > maxActivity) {
                    maxActivity = heatmap[d][h];
                    peakDay = d;
                    peakHour = h;
                }
            }
        }

        let heatmapText = '```\n     ';
        for (let h = 0; h < 24; h++) {
            heatmapText += String(h).padStart(2, '0') + ' ';
        }
        heatmapText += '\n';

        for (let d = 0; d < 7; d++) {
            heatmapText += days[d] + ': ';
            for (let h = 0; h < 24; h++) {
                const intensity = Math.min(9, Math.floor(heatmap[d][h] / (maxActivity / 9)));
                heatmapText += intensity > 0 ? intensity : '·';
                heatmapText += '  ';
            }
            heatmapText += '\n';
        }
        heatmapText += '```';

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('🔥 Activity Heatmap')
            .setDescription('Server activity by day and hour (0-9 intensity scale)')
            .addFields(
                { name: '📊 Heatmap', value: heatmapText, inline: false },
                { name: '🎯 Peak Activity', value: `**${days[peakDay]}** at **${peakHour}:00**\n${maxActivity} messages`, inline: true },
                { name: '📈 Busiest Day', value: days[peakDay], inline: true },
                { name: '⏰ Busiest Hour', value: `${peakHour}:00 - ${peakHour + 1}:00`, inline: true }
            )
            .setFooter({ text: `${getServerName()} • Higher numbers = more activity` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
    async showChannelStats(interaction) {
        const guildId = interaction.guild.id;

        const channelStats = await ChannelActivity.findAll({
            where: { guildId: guildId },
            attributes: [
                'channelId',
                'channelName',
                'channelType',
                [require('sequelize').fn('SUM', require('sequelize').col('messageCount')), 'total']
            ],
            group: ['channelId', 'channelName', 'channelType'],
            order: [[require('sequelize').literal('total'), 'DESC']],
            limit: 10
        });

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('📊 Channel Analytics')
            .setDescription('Top 10 most active channels')
            .setFooter({ text: getServerName() })
            .setTimestamp();

        channelStats.forEach((channel, index) => {
            const emoji = channel.channelType === 'voice' ? '🔊' : '💬';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

            embed.addFields({
                name: `${medal} ${emoji} ${channel.channelName}`,
                value: `${channel.dataValues.total} messages`,
                inline: true
            });
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async showMemberEngagement(interaction) {
        const guildId = interaction.guild.id;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const topUsers = await MessageAnalytics.findAll({
            where: {
                guildId: guildId,
                createdAt: { [require('sequelize').Op.gte]: sevenDaysAgo }
            },
            attributes: [
                'userId',
                'userName',
                [require('sequelize').fn('SUM', require('sequelize').col('messageCount')), 'total']
            ],
            group: ['userId', 'userName'],
            order: [[require('sequelize').literal('total'), 'DESC']],
            limit: 10
        });
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('👥 Member Engagement')
            .setDescription('Top 10 most active members (last 7 days)')
            .setFooter({ text: getServerName() })
            .setTimestamp();

        topUsers.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

            embed.addFields({
                name: `${medal} ${user.userName}`,
                value: `${user.dataValues.total} messages`,
                inline: true
            });
        });

        const totalMembers = interaction.guild.memberCount;
        const activeMembers = await MessageAnalytics.count({
            where: {
                guildId: guildId,
                createdAt: { [require('sequelize').Op.gte]: sevenDaysAgo }
            },
            distinct: true,
            col: 'userId'
        });

        const engagementRate = ((activeMembers / totalMembers) * 100).toFixed(1);

        embed.addFields({
            name: '📈 Engagement Rate',
            value: `${engagementRate}% (${activeMembers}/${totalMembers} members)`,
            inline: false
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async showGrowthTracking(interaction) {
        const guildId = interaction.guild.id;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const memberFlow = await MemberFlow.findAll({
            where: {
                guildId: guildId,
                createdAt: { [require('sequelize').Op.gte]: thirtyDaysAgo }
            },
            attributes: [
                'date',
                'action',
                [require('sequelize').fn('COUNT', '*'), 'count']
            ],
            group: ['date', 'action'],
            order: [['date', 'DESC']]
        });
        const growthData = {};
        let currentTotal = interaction.guild.memberCount;

        memberFlow.forEach(flow => {
            const date = flow.date;
            if (!growthData[date]) {
                growthData[date] = { joins: 0, leaves: 0 };
            }

            if (flow.action === 'join') {
                growthData[date].joins = parseInt(flow.dataValues.count);
            } else {
                growthData[date].leaves = parseInt(flow.dataValues.count);
            }
        });

        let totalJoins = 0;
        let totalLeaves = 0;
        Object.values(growthData).forEach(day => {
            totalJoins += day.joins;
            totalLeaves += day.leaves;
        });

        const netGrowth = totalJoins - totalLeaves;
        const growthRate = ((netGrowth / (currentTotal - netGrowth)) * 100).toFixed(1);

        const embed = new EmbedBuilder()
            .setColor(netGrowth >= 0 ? getEmbedColor('success') : getEmbedColor('error'))
            .setTitle('📈 Member Growth Tracking')
            .setDescription(`30-day growth analysis for ${getServerName()}`)
            .addFields(
                { name: '📥 Total Joins', value: totalJoins.toString(), inline: true },
                { name: '📤 Total Leaves', value: totalLeaves.toString(), inline: true },
                { name: '📊 Net Growth', value: `${netGrowth >= 0 ? '+' : ''}${netGrowth}`, inline: true },
                { name: '📈 Growth Rate', value: `${growthRate}%`, inline: true },
                { name: '👥 Current Members', value: currentTotal.toString(), inline: true },
                { name: '📅 Period', value: '30 days', inline: true }
            )
            .setFooter({ text: getServerName() })
            .setTimestamp();

        const recentDays = Object.entries(growthData).slice(0, 7);
        if (recentDays.length > 0) {
            const breakdown = recentDays.map(([date, data]) => {
                const net = data.joins - data.leaves;
                return `${date}: +${data.joins}/-${data.leaves} (${net >= 0 ? '+' : ''}${net})`;
            }).join('\n');

            embed.addFields({
                name: '📅 Recent Days',
                value: `\`\`\`\n${breakdown}\n\`\`\``,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },
        let rating;
        if (totalScore >= 80) rating = '⭐⭐⭐⭐⭐ Extremely Active';
        else if (totalScore >= 60) rating = '⭐⭐⭐⭐ Very Active';
        else if (totalScore >= 40) rating = '⭐⭐⭐ Active';
        else if (totalScore >= 20) rating = '⭐⭐ Moderate';
        else rating = '⭐ Low Activity';

        return `${totalScore}/100\n${rating}`;
    },

    getRaidRecommendation(severity) {
        switch(severity) {
            case 'high':
                return '1. Enable lockdown immediately (/lockdown start)\n2. Review recent joins (/joininfo)\n3. Consider enabling verification\n4. Alert staff team';
            case 'medium':
                return '1. Monitor new joins closely\n2. Check member risk scores\n3. Be ready to lockdown if needed\n4. Review audit logs';
            case 'low':
                return '1. Keep an eye on new members\n2. Check if joins are legitimate\n3. No immediate action needed';
            default:
                return 'Continue normal operations';
        }
    }
};