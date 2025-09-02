const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup and verify bot configuration (Admin only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('dashboard')
                .setDescription('Setup verification dashboard channel permissions'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Check all bot configurations'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.options.getSubcommand() === 'dashboard') {
            const dashboardChannel = interaction.guild.channels.cache.get(process.env.VERIFICATION_DASHBOARD_CHANNEL_ID);

            if (!dashboardChannel) {
                return interaction.editReply('❌ Verification dashboard channel not found! Please set VERIFICATION_DASHBOARD_CHANNEL_ID in .env');
            }

            const staffRole = interaction.guild.roles.cache.get(process.env.STAFF_ROLE_ID);
            const adminRole = interaction.guild.roles.cache.get(process.env.ADMIN_ROLE_ID);

            if (!staffRole || !adminRole) {
                return interaction.editReply('❌ Staff or Admin role not found! Please configure roles in .env');
            }
            try {
                await dashboardChannel.permissionOverwrites.set([
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    },
                    {
                        id: staffRole.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: adminRole.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages],
                    }
                ]);

                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('success'))
                    .setTitle(`✅ Dashboard Setup Complete`)
                    .setDescription(`Verification dashboard channel has been secured!`)
                    .addFields(
                        { name: '🔒 Channel', value: `<#${dashboardChannel.id}>`, inline: true },
                        { name: '✅ Staff Access', value: `<@&${staffRole.id}>`, inline: true },
                        { name: '✅ Admin Access', value: `<@&${adminRole.id}>`, inline: true },
                        { name: '❌ Everyone', value: 'Access Denied', inline: true }
                    )
                    .setFooter({ text: getServerName() })
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error(error);
                await interaction.editReply('❌ Failed to setup dashboard permissions!');
            }

        } else if (interaction.options.getSubcommand() === 'check') {
            const checks = [];

            const channels = {
                'Log Channel': process.env.LOG_CHANNEL_ID,
                'Voice Log Channel': process.env.VOICE_LOG_CHANNEL_ID,
                'Message Log Channel': process.env.MESSAGE_LOG_CHANNEL_ID,
                'Admin Alert Channel': process.env.ADMIN_ALERT_CHANNEL_ID,
                'Verification Dashboard': process.env.VERIFICATION_DASHBOARD_CHANNEL_ID,
                'Verification Voice 1': process.env.VERIFICATION_VOICE_1,
                'Verification Voice 2': process.env.VERIFICATION_VOICE_2,
                'Verification Voice 3': process.env.VERIFICATION_VOICE_3,
                'Verification Voice 4': process.env.VERIFICATION_VOICE_4
            };

            for (const [name, id] of Object.entries(channels)) {
                const channel = interaction.guild.channels.cache.get(id);
                checks.push({
                    name: name,
                    value: channel ? `✅ <#${id}>` : `❌ Not found (ID: ${id || 'Not set'})`,
                    inline: true
                });
            }
            const roles = {
                'Admin Role': process.env.ADMIN_ROLE_ID,
                'Staff Role': process.env.STAFF_ROLE_ID,
                'Unverified Role': process.env.UNVERIFIED_ROLE_ID,
                'Verified Role': process.env.VERIFIED_ROLE_ID,
                'Boy Role': process.env.BOY_ROLE_ID,
                'Girl Role': process.env.GIRL_ROLE_ID,
                'Muted Role': process.env.MUTED_ROLE_ID
            };

            const roleChecks = [];
            for (const [name, id] of Object.entries(roles)) {
                const role = interaction.guild.roles.cache.get(id);
                roleChecks.push({
                    name: name,
                    value: role ? `✅ <@&${id}>` : `❌ Not found (ID: ${id || 'Not set'})`,
                    inline: true
                });
            }

            const dashboardChannel = interaction.guild.channels.cache.get(process.env.VERIFICATION_DASHBOARD_CHANNEL_ID);
            let dashboardSecure = false;

            if (dashboardChannel) {
                const everyonePerms = dashboardChannel.permissionsFor(interaction.guild.roles.everyone);
                dashboardSecure = everyonePerms && !everyonePerms.has(PermissionFlagsBits.ViewChannel);
            }
            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle(`🔧 ${getServerName()} - Configuration Check`)
                .setDescription(`**Server Branding:**\nName: \`${getServerName()}\`\nColor: \`${process.env.EMBED_COLOR || '#0099FF'}\``)
                .addFields(
                    { name: '📢 Channels Configuration', value: '\u200B', inline: false },
                    ...checks.slice(0, 9),
                    { name: '👥 Roles Configuration', value: '\u200B', inline: false },
                    ...roleChecks,
                    {
                        name: '🔒 Security Check',
                        value: `Dashboard Channel: ${dashboardSecure ? '✅ Secured (Staff only)' : '⚠️ Not secured! Run /setup dashboard'}`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Run /setup dashboard to secure the verification dashboard' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};