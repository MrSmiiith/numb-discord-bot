const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('View invite statistics')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all server invites'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('View invites created by a user')
                .addUserOption(option =>
                    option.setName('member')
                        .setDescription('Member to check')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('top')
                .setDescription('View top inviters'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
            const invites = await interaction.guild.invites.fetch();

            if (invites.size === 0) {
                return interaction.editReply('No invites found for this server.');
            }

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle('📨 Server Invites')
                .setDescription(`Total invites: ${invites.size}`)
                .setFooter({ text: getServerName() })
                .setTimestamp();

            const sortedInvites = Array.from(invites.values())
                .sort((a, b) => (b.uses || 0) - (a.uses || 0))
                .slice(0, 10);
            sortedInvites.forEach(invite => {
                const expiresAt = invite.expiresTimestamp
                    ? `<t:${Math.floor(invite.expiresTimestamp / 1000)}:R>`
                    : 'Never';

                embed.addFields({
                    name: `📎 ${invite.code}`,
                    value: `**Uses:** ${invite.uses || 0}/${invite.maxUses || '∞'}\n**Creator:** ${invite.inviter ? invite.inviter.tag : 'Unknown'}\n**Channel:** ${invite.channel ? `<#${invite.channel.id}>` : 'Unknown'}\n**Expires:** ${expiresAt}`,
                    inline: true
                });
            });

            await interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'user') {
            const user = interaction.options.getUser('member');
            const invites = await interaction.guild.invites.fetch();

            const userInvites = invites.filter(i => i.inviter?.id === user.id);

            if (userInvites.size === 0) {
                return interaction.editReply(`${user.tag} has no active invites.`);
            }

            const totalUses = userInvites.reduce((acc, inv) => acc + (inv.uses || 0), 0);

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle(`📨 Invites by ${user.tag}`)
                .setThumbnail(user.displayAvatarURL())
                .setDescription(`**Active Invites:** ${userInvites.size}\n**Total Uses:** ${totalUses}`)
                .setFooter({ text: getServerName() })
                .setTimestamp();

            userInvites.forEach(invite => {
                embed.addFields({
                    name: `📎 ${invite.code}`,
                    value: `**Uses:** ${invite.uses || 0}/${invite.maxUses || '∞'}\n**Channel:** ${invite.channel ? `<#${invite.channel.id}>` : 'Unknown'}`,
                    inline: true
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'top') {
            const joinLogs = await Log.findAll({
                where: {
                    guildId: interaction.guild.id,
                    type: 'MEMBER_JOIN'
                }
            });

            const inviterStats = {};

            joinLogs.forEach(log => {
                if (log.extra?.inviter?.id) {
                    const inviterId = log.extra.inviter.id;
                    if (!inviterStats[inviterId]) {
                        inviterStats[inviterId] = {
                            tag: log.extra.inviter.tag,
                            count: 0
                        };
                    }
                    inviterStats[inviterId].count++;
                }
            });

            const currentInvites = await interaction.guild.invites.fetch();
            currentInvites.forEach(invite => {
                if (invite.inviter && invite.uses > 0) {
                    const inviterId = invite.inviter.id;
                    if (!inviterStats[inviterId]) {
                        inviterStats[inviterId] = {
                            tag: invite.inviter.tag,
                            count: 0
                        };
                    }
                    inviterStats[inviterId].currentUses = (inviterStats[inviterId].currentUses || 0) + invite.uses;
                }
            });

            const sortedInviters = Object.entries(inviterStats)
                .map(([id, data]) => ({
                    id,
                    tag: data.tag,
                    total: data.count + (data.currentUses || 0)
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);

            if (sortedInviters.length === 0) {
                return interaction.editReply('No invite data available.');
            }

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle('🏆 Top Inviters')
                .setDescription('Users who have invited the most members')
                .setFooter({ text: getServerName() })
                .setTimestamp();

            sortedInviters.forEach((inviter, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                embed.addFields({
                    name: `${medal} ${inviter.tag}`,
                    value: `**Total Invites:** ${inviter.total}\n**User:** <@${inviter.id}>`,
                    inline: true
                });
            });

            await interaction.editReply({ embeds: [embed] });
        }
    }
};