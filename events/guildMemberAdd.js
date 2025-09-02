const { Events, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const inviteData = await trackInviter(member);

        const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
        const accountAgeHours = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60));
        const riskLevel = calculateRiskLevel(member, accountAge);

        const suspiciousPatterns = checkSuspiciousPatterns(member);

        const mutualGuilds = member.client.guilds.cache.filter(g => g.members.cache.has(member.id));

        await Log.create({
            guildId: member.guild.id,
            type: 'MEMBER_JOIN',
            userId: member.id,
            userName: member.user.tag,
            extra: {
                accountCreated: member.user.createdAt.toISOString(),
                accountAge: accountAge,
                inviter: inviteData?.inviter || null,
                inviteCode: inviteData?.code || null,
                riskLevel: riskLevel,
                suspicious: suspiciousPatterns,
                avatar: member.user.avatarURL(),
                bot: member.user.bot,
                flags: member.user.flags?.toArray() || []
            }
        });
        const unverifiedRole = member.guild.roles.cache.get(config.roles.verification.unverified);
        if (unverifiedRole) {
            try {
                await member.roles.add(unverifiedRole);
                console.log(`Assigned unverified role to ${member.user.tag}`);
            } catch (error) {
                console.error(`Failed to assign unverified role to ${member.user.tag}:`, error);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`📥 New Member Joined - ${riskLevel.emoji} ${riskLevel.level} Risk`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `${getServerName()} • User ID: ${member.id}` })
            .setTimestamp();

        if (riskLevel.level === 'High') {
            embed.setColor('#FF0000');
        } else if (riskLevel.level === 'Medium') {
            embed.setColor('#FFA500');
        } else {
            embed.setColor(getEmbedColor('success'));
        }

        embed.addFields(
            { name: '👤 User', value: `${member} (${member.user.tag})`, inline: true },
            { name: '🆔 User ID', value: member.id, inline: true },
            { name: '🤖 Bot Account', value: member.user.bot ? '✅ Yes' : '❌ No', inline: true }
        );
        embed.addFields(
            {
                name: '📅 Account Created',
                value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>\n(${accountAge > 0 ? `${accountAge} days` : `${accountAgeHours} hours`} ago)`,
                inline: true
            },
            {
                name: '🎯 Account Type',
                value: `${member.user.bot ? 'Bot' : 'User'}\n${member.user.system ? 'System' : 'Regular'}`,
                inline: true
            },
            {
                name: '#️⃣ Discriminator',
                value: member.user.discriminator === '0' ? 'New Username' : `#${member.user.discriminator}`,
                inline: true
            }
        );

        if (inviteData) {
            embed.addFields(
                {
                    name: '🎫 Invite Code',
                    value: inviteData.code || 'Unknown',
                    inline: true
                },
                {
                    name: '👥 Invited By',
                    value: inviteData.inviter ? `<@${inviteData.inviter.id}>\n${inviteData.inviter.tag}` : 'Unknown',
                    inline: true
                },
                {
                    name: '📊 Invite Uses',
                    value: inviteData.uses ? `${inviteData.uses} uses` : 'Unknown',
                    inline: true
                }
            );
        } else {
            embed.addFields({
                name: '🎫 Invite Information',
                value: 'Could not track invite (Vanity URL, Discovery, or Bot invite)',
                inline: false
            });
        }
        embed.addFields({
            name: `${riskLevel.emoji} Risk Assessment`,
            value: `**Level:** ${riskLevel.level}\n**Score:** ${riskLevel.score}/100\n**Reasons:** ${riskLevel.reasons.join(', ') || 'None'}`,
            inline: false
        });

        if (suspiciousPatterns.length > 0) {
            embed.addFields({
                name: '⚠️ Warning Flags',
                value: suspiciousPatterns.map(p => `• ${p}`).join('\n'),
                inline: false
            });
        }

        if (member.user.flags) {
            const flags = member.user.flags.toArray();
            if (flags.length > 0) {
                const flagEmojis = {
                    'Staff': '👮',
                    'Partner': '🤝',
                    'Hypesquad': '🏠',
                    'BugHunterLevel1': '🐛',
                    'BugHunterLevel2': '🐛',
                    'HypeSquadOnlineHouse1': '🟣',
                    'HypeSquadOnlineHouse2': '🔴',
                    'HypeSquadOnlineHouse3': '🟢',
                    'PremiumEarlySupporter': '💎',
                    'VerifiedBot': '✅',
                    'VerifiedDeveloper': '👨‍💻',
                    'CertifiedModerator': '🛡️',
                    'ActiveDeveloper': '⚡'
                };

                const flagDisplay = flags.map(f => `${flagEmojis[f] || '🏳️'} ${f}`).join('\n');
                embed.addFields({
                    name: '🏅 Profile Badges',
                    value: flagDisplay,
                    inline: true
                });
            }
        }
        embed.addFields({
            name: '📊 Server Stats',
            value: `**Member Count:** ${member.guild.memberCount}\n**Member #${member.guild.memberCount}**`,
            inline: true
        });

        if (member.user.avatar) {
            const hasAnimatedAvatar = member.user.avatar.startsWith('a_');
            const defaultAvatar = member.user.defaultAvatarURL === member.user.displayAvatarURL();

            embed.addFields({
                name: '🖼️ Avatar Info',
                value: `${defaultAvatar ? '⚠️ Default Avatar' : hasAnimatedAvatar ? '✨ Animated Avatar' : '🖼️ Custom Avatar'}\n[Avatar Link](${member.user.displayAvatarURL({ size: 1024 })})`,
                inline: true
            });
        }

        const logChannel = member.guild.channels.cache.get(config.channels.logs.general);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }

        if (riskLevel.level === 'High') {
            const alertChannel = member.guild.channels.cache.get(config.channels.verification.adminAlert);
            if (alertChannel) {
                const alertEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🚨 High Risk Member Joined')
                    .setDescription(`A potentially suspicious account has joined the server!`)
                    .setThumbnail(member.user.displayAvatarURL())
                    .addFields(
                        { name: 'User', value: `${member} (${member.user.tag})`, inline: true },
                        { name: 'Account Age', value: `${accountAge > 0 ? `${accountAge} days` : `${accountAgeHours} hours`}`, inline: true },
                        { name: 'Risk Score', value: `${riskLevel.score}/100`, inline: true },
                        { name: 'Concerns', value: riskLevel.reasons.join('\n'), inline: false }
                    )
                    .setFooter({ text: 'Consider manual verification or monitoring' })
                    .setTimestamp();

                const adminRole = member.guild.roles.cache.get(config.roles.staff.admin);
                await alertChannel.send({
                    content: adminRole ? `<@&${adminRole.id}>` : null,
                    embeds: [alertEmbed]
                });
            }
        }

        if (member.client.analytics) {
            await member.client.analytics.collectMemberFlow(member, 'join', inviteData, riskLevel.score);
        }
    },
};
const guildInvites = new Map();

async function cacheInvites(client) {
    client.guilds.cache.forEach(async (guild) => {
        try {
            const invites = await guild.invites.fetch();
            guildInvites.set(guild.id, new Map(invites.map(i => [i.code, i.uses])));
        } catch (error) {
            console.log(`Could not fetch invites for ${guild.name}`);
        }
    });
}

module.exports.cacheInvites = cacheInvites;

async function trackInviter(member) {
    try {
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = guildInvites.get(member.guild.id) || new Map();

        guildInvites.set(member.guild.id, new Map(newInvites.map(i => [i.code, i.uses])));

        const usedInvite = newInvites.find(i => {
            const oldUses = oldInvites.get(i.code) || 0;
            return i.uses > oldUses;
        });

        if (usedInvite) {
            return {
                code: usedInvite.code,
                inviter: usedInvite.inviter,
                uses: usedInvite.uses,
                maxUses: usedInvite.maxUses,
                temporary: usedInvite.temporary,
                createdAt: usedInvite.createdTimestamp
            };
        }

        if (member.guild.vanityURLCode) {
            const vanityData = await member.guild.fetchVanityData().catch(() => null);
            if (vanityData) {
                return {
                    code: vanityData.code,
                    inviter: null,
                    uses: vanityData.uses,
                    type: 'vanity'
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error tracking invite:', error);
        return null;
    }
}
function calculateRiskLevel(member, accountAge) {
    let riskScore = 0;
    const reasons = [];

    if (accountAge < 1) {
        riskScore += 40;
        reasons.push('Brand new account (<1 day)');
    } else if (accountAge < 7) {
        riskScore += 30;
        reasons.push('Very new account (<7 days)');
    } else if (accountAge < 30) {
        riskScore += 20;
        reasons.push('New account (<30 days)');
    } else if (accountAge < 90) {
        riskScore += 10;
        reasons.push('Recent account (<90 days)');
    }

    if (!member.user.avatar) {
        riskScore += 20;
        reasons.push('Default avatar');
    }

    const username = member.user.username.toLowerCase();

    if (/^[a-z]{3,5}\d{3,6}$/.test(username)) {
        riskScore += 20;
        reasons.push('Generic username pattern');
    }

    if (username.includes('discord') && !member.user.bot) {
        riskScore += 20;
        reasons.push('Discord in username');
    }

    if (/\d{4,}/.test(username)) {
        riskScore += 10;
        reasons.push('Many numbers in username');
    }

    if (/(nitro|free|gift|steam|cs:go|csgo)/i.test(username)) {
        riskScore += 15;
        reasons.push('Possible advertising name');
    }

    if (!member.user.banner && !member.user.accentColor) {
        riskScore += 5;
        reasons.push('No profile customization');
    }

    let level, emoji;
    if (riskScore >= 60) {
        level = 'High';
        emoji = '🔴';
    } else if (riskScore >= 30) {
        level = 'Medium';
        emoji = '🟡';
    } else {
        level = 'Low';
        emoji = '🟢';
    }

    return { score: riskScore, level, emoji, reasons };
}
function checkSuspiciousPatterns(member) {
    const patterns = [];
    const username = member.user.username.toLowerCase();
    const createdAt = member.user.createdTimestamp;

    const now = Date.now();
    const accountAgeMinutes = Math.floor((now - createdAt) / (1000 * 60));

    if (accountAgeMinutes < 10) {
        patterns.push('🚨 Account created less than 10 minutes ago');
    }

    if (username.length < 3) {
        patterns.push('📝 Very short username');
    }

    if (/^[^a-zA-Z0-9]+$/.test(username)) {
        patterns.push('🔤 Username contains only special characters');
    }

    if (/(.)\1{3,}/.test(username)) {
        patterns.push('🔁 Repeated characters in username');
    }

    if (/(admin|mod|staff|owner|support)/i.test(username) && !member.user.bot) {
        patterns.push('👮 Possible staff impersonation');
    }

    const scamPatterns = [
        /n[i1]tr[o0]/i,
        /fr[e3][e3]/i,
        /g[i1]ft/i,
        /g[i1]v[e3]away/i,
        /st[e3]am/i,
        /d[i1]sc[o0]rd\.gg/i
    ];

    if (scamPatterns.some(pattern => pattern.test(username))) {
        patterns.push('💰 Possible scam/phishing name');
    }

    if (/[\u0300-\u036f\u0483-\u0489\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/.test(username)) {
        patterns.push('🌀 Zalgo/special characters detected');
    }

    if (member.user.discriminator === '0001') {
        patterns.push('🎯 Early adopter discriminator');
    }

    if (username === username.toUpperCase() && username.length > 2 && /[A-Z]/.test(username)) {
        patterns.push('📢 All caps username');
    }

    return patterns;
}