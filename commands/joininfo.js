const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joininfo')
        .setDescription('Get detailed join information about a member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Member to check')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        await interaction.deferReply();

        const user = interaction.options.getUser('member');
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.editReply({
                content: '❌ Member not found in this server!',
                ephemeral: true
            });
        }

        const joinLog = await Log.findOne({
            where: {
                guildId: interaction.guild.id,
                userId: user.id,
                type: 'MEMBER_JOIN'
            },
            order: [['createdAt', 'DESC']]
        });

        const accountAge = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));
        const joinAge = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`📋 Join Information - ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: getServerName() })
            .setTimestamp();
        embed.addFields(
            { name: '👤 User', value: `${user}`, inline: true },
            { name: '🆔 User ID', value: user.id, inline: true },
            { name: '🤖 Bot', value: user.bot ? '✅ Yes' : '❌ No', inline: true },
            {
                name: '📅 Account Created',
                value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n(${accountAge} days ago)`,
                inline: true
            },
            {
                name: '📥 Joined Server',
                value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n(${joinAge} days ago)`,
                inline: true
            },
            {
                name: '📊 Join Position',
                value: `${Array.from(interaction.guild.members.cache.values())
                    .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
                    .findIndex(m => m.id === member.id) + 1}/${interaction.guild.memberCount}`,
                inline: true
            }
        );

        if (joinLog && joinLog.extra) {
            const data = joinLog.extra;

            if (data.riskLevel) {
                embed.addFields({
                    name: `${data.riskLevel.emoji || '🔍'} Risk Assessment at Join`,
                    value: `**Level:** ${data.riskLevel.level || 'Unknown'}\n**Score:** ${data.riskLevel.score || 0}/100\n**Factors:** ${data.riskLevel.reasons?.join(', ') || 'None'}`,
                    inline: false
                });
            }

            if (data.inviter || data.inviteCode) {
                embed.addFields({
                    name: '🎫 Invite Information',
                    value: `**Invite Code:** ${data.inviteCode || 'Unknown'}\n**Invited By:** ${data.inviter ? `<@${data.inviter.id}> (${data.inviter.tag})` : 'Unknown'}`,
                    inline: false
                });
            }

            if (data.suspicious && data.suspicious.length > 0) {
                embed.addFields({
                    name: '⚠️ Flags at Join',
                    value: data.suspicious.map(s => `• ${s}`).join('\n'),
                    inline: false
                });
            }
        } else {
            embed.addFields({
                name: '📝 Join Log',
                value: 'No detailed join information available (joined before tracking was enabled)',
                inline: false
            });
        }
        const recentLogs = await Log.findAll({
            where: {
                guildId: interaction.guild.id,
                userId: user.id
            },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        if (recentLogs.length > 0) {
            const activity = recentLogs.map(log => {
                const date = new Date(log.createdAt).toLocaleDateString();
                return `• **${log.type}** - ${date}`;
            }).join('\n');

            embed.addFields({
                name: '📊 Recent Activity',
                value: activity.substring(0, 1024),
                inline: false
            });
        }

        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());

        if (roles.length > 0) {
            embed.addFields({
                name: `🎭 Current Roles [${roles.length}]`,
                value: roles.slice(0, 10).join(', ') + (roles.length > 10 ? ` and ${roles.length - 10} more...` : ''),
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};