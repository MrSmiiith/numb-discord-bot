const { Events, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        await Log.create({
            guildId: member.guild.id,
            type: 'MEMBER_LEAVE',
            userId: member.id,
            userName: member.user.tag,
            extra: {
                joinedAt: member.joinedAt,
                roles: member.roles.cache.map(r => r.name)
            }
        });

        if (member.client.analytics) {
            await member.client.analytics.collectMemberFlow(member, 'leave');
        }

        const logChannel = member.guild.channels.cache.get(config.channels.logs.general);
        if (!logChannel) return;

        const joinDuration = member.joinedAt
            ? Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24))
            : 'Unknown';

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('error'))
            .setTitle('📤 Member Left')
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '👤 User', value: `${member.user.tag}`, inline: true },
                { name: '🆔 User ID', value: member.id, inline: true },
                { name: '⏱️ Member For', value: `${joinDuration} days`, inline: true },
                { name: '📅 Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Unknown', inline: true },
                { name: '📤 Left', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '👥 Member Count', value: member.guild.memberCount.toString(), inline: true }
            )
            .setFooter({ text: `${getServerName()} • User left or was kicked` })
            .setTimestamp();

        const roles = member.roles.cache
            .filter(role => role.id !== member.guild.id)
            .map(role => role.toString());

        if (roles.length > 0) {
            embed.addFields({
                name: '🎭 Had Roles',
                value: roles.slice(0, 10).join(', ') + (roles.length > 10 ? ` and ${roles.length - 10} more...` : ''),
                inline: false
            });
        }

        await logChannel.send({ embeds: [embed] });
    }
};