const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get detailed information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to get info about')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.reply({
                content: '❌ User not found in this server!',
                ephemeral: true
            });
        }

        const accountAge = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));
        const joinAge = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));

        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());

        const keyPermissions = [];
        if (member.permissions.has(PermissionFlagsBits.Administrator)) keyPermissions.push('Administrator');
        if (member.permissions.has(PermissionFlagsBits.ModerateMembers)) keyPermissions.push('Moderate Members');
        if (member.permissions.has(PermissionFlagsBits.ManageGuild)) keyPermissions.push('Manage Server');
        if (member.permissions.has(PermissionFlagsBits.ManageMessages)) keyPermissions.push('Manage Messages');
        if (member.permissions.has(PermissionFlagsBits.KickMembers)) keyPermissions.push('Kick Members');
        if (member.permissions.has(PermissionFlagsBits.BanMembers)) keyPermissions.push('Ban Members');
        const status = member.presence?.status || 'offline';
        const statusEmojis = {
            'online': '🟢',
            'idle': '🟡',
            'dnd': '🔴',
            'offline': '⚫'
        };

        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor || getEmbedColor('info'))
            .setTitle(`👤 User Information - ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'User', value: `${user}`, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Status', value: `${statusEmojis[status]} ${status}`, inline: true },
                { name: 'Nickname', value: member.nickname || 'None', inline: true },
                { name: 'Bot', value: user.bot ? '✅ Yes' : '❌ No', inline: true },
                { name: 'Boosting', value: member.premiumSince ? `✅ Since ${member.premiumSince.toLocaleDateString()}` : '❌ No', inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n(${accountAge} days ago)`, inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n(${joinAge} days ago)`, inline: true },
                { name: 'Join Position', value: `${Array.from(interaction.guild.members.cache.values()).sort((a, b) => a.joinedTimestamp - b.joinedTimestamp).findIndex(m => m.id === member.id) + 1}/${interaction.guild.memberCount}`, inline: true }
            );

        if (roles.length > 0) {
            embed.addFields({
                name: `Roles [${roles.length}]`,
                value: roles.slice(0, 20).join(', ') + (roles.length > 20 ? ` and ${roles.length - 20} more...` : ''),
                inline: false
            });
        }

        if (keyPermissions.length > 0) {
            embed.addFields({
                name: 'Key Permissions',
                value: keyPermissions.join(', '),
                inline: false
            });
        }

        if (user.banner) {
            embed.setImage(user.bannerURL({ dynamic: true, size: 512 }));
        }

        embed.setFooter({ text: getServerName() }).setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};