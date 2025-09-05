const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

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
                .setName('send-dashboard')
                .setDescription('Send verification dashboard to the dashboard channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Check all bot configurations'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: ['Ephemeral'] });

        if (interaction.options.getSubcommand() === 'dashboard') {
            const dashboardChannel = interaction.guild.channels.cache.get(config.channels.verification.dashboard);

            if (!dashboardChannel) {
                return interaction.editReply('❌ Verification dashboard channel not found! Please set it in config.js');
            }

            const staffRole = interaction.guild.roles.cache.get(config.roles.staff.moderator);
            const adminRole = interaction.guild.roles.cache.get(config.roles.staff.admin);

            if (!staffRole || !adminRole) {
                return interaction.editReply('❌ Staff or Admin role not found! Please configure roles in config.js');
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

        } else if (interaction.options.getSubcommand() === 'send-dashboard') {
            const dashboardChannel = interaction.guild.channels.cache.get(config.channels.verification.dashboard);

            if (!dashboardChannel) {
                return interaction.editReply('❌ Verification dashboard channel not found! Please set it in config.js');
            }

            try {
                // Create verification dashboard embed
                const dashboardEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('info'))
                    .setTitle(`🔐 ${getServerName()} - Verification Dashboard`)
                    .setDescription(`
                        **Welcome to the Staff Verification Dashboard**
                        
                        This channel is used to manage member verification requests. 
                        When unverified members join voice verification channels, alerts will be sent here.
                        
                        **How to Use:**
                        • Wait for verification alerts to appear
                        • Join the voice channel with the user
                        • Verify their identity and age appropriately
                        • Use the buttons below to approve or deny verification
                        • Use \`/verify @user boy/girl\` command for manual verification
                        
                        **Security Guidelines:**
                        ✅ Check account age (avoid very new accounts)
                        ✅ Verify voice matches claimed gender/age
                        ✅ Look for suspicious behavior patterns
                        ✅ Check user's join date and activity
                        ❌ Never verify users who refuse voice verification
                        ❌ Be cautious with accounts under 30 days old
                    `)
                    .addFields(
                        { 
                            name: '🎤 Voice Verification Channels', 
                            value: config.channels.verification.voiceChannels
                                .map(id => `<#${id}>`)
                                .join('\n') || 'No channels configured',
                            inline: true 
                        },
                        { 
                            name: '🔔 Alert Channel', 
                            value: `<#${config.channels.verification.adminAlert}>` || 'Not configured',
                            inline: true 
                        },
                        { 
                            name: '📊 Quick Stats', 
                            value: `**Available Commands:**\n\`/verify\` - Manual verification\n\`/analytics\` - User risk assessment\n\`/userinfo\` - User details`,
                            inline: false 
                        }
                    )
                    .setThumbnail(interaction.guild.iconURL())
                    .setFooter({ text: `${getServerName()} • Staff Only Dashboard` })
                    .setTimestamp();

                // Create action buttons for quick actions
                const actionButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('verification_guide')
                            .setLabel('📖 Verification Guide')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('refresh_dashboard')
                            .setLabel('🔄 Refresh Dashboard')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('verification_stats')
                            .setLabel('📊 Verification Stats')
                            .setStyle(ButtonStyle.Success)
                    );

                // Send the dashboard to the channel
                await dashboardChannel.send({ 
                    embeds: [dashboardEmbed], 
                    components: [actionButtons] 
                });

                // Confirm to admin
                const confirmEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('success'))
                    .setTitle('✅ Verification Dashboard Sent!')
                    .setDescription(`The verification dashboard has been successfully sent to <#${dashboardChannel.id}>`)
                    .addFields(
                        { name: '📢 Channel', value: `<#${dashboardChannel.id}>`, inline: true },
                        { name: '🔒 Access', value: 'Staff & Admins Only', inline: true },
                        { name: '⚡ Features', value: 'Interactive buttons included', inline: true }
                    )
                    .setFooter({ text: getServerName() })
                    .setTimestamp();

                await interaction.editReply({ embeds: [confirmEmbed] });

            } catch (error) {
                console.error(error);
                await interaction.editReply('❌ Failed to send verification dashboard!');
            }

        } else if (interaction.options.getSubcommand() === 'check') {
            const checks = [];

            const channels = {
                'Log Channel': config.channels.logs.general,
                'Voice Log Channel': config.channels.logs.voice,
                'Message Log Channel': config.channels.logs.message,
                'Admin Alert Channel': config.channels.verification.adminAlert,
                'Verification Dashboard': config.channels.verification.dashboard,
                'Verification Voice 1': config.channels.verification.voiceChannels[0],
                'Verification Voice 2': config.channels.verification.voiceChannels[1],
                'Verification Voice 3': config.channels.verification.voiceChannels[2],
                'Verification Voice 4': config.channels.verification.voiceChannels[3]
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
                'Admin Role': config.roles.staff.admin,
                'Staff Role': config.roles.staff.moderator,
                'Unverified Role': config.roles.verification.unverified,
                'Verified Role': config.roles.verification.verified,
                'Boy Role': config.roles.gender.boy,
                'Girl Role': config.roles.gender.girl,
                'Muted Role': config.roles.moderation.muted
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

            const dashboardChannel = interaction.guild.channels.cache.get(config.channels.verification.dashboard);
            let dashboardSecure = false;

            if (dashboardChannel) {
                const everyonePerms = dashboardChannel.permissionsFor(interaction.guild.roles.everyone);
                dashboardSecure = everyonePerms && !everyonePerms.has(PermissionFlagsBits.ViewChannel);
            }
            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle(`🔧 ${getServerName()} - Configuration Check`)
                .setDescription(`**Server Branding:**\nName: \`${getServerName()}\`\nColor: \`${config.branding.embedColor || '#0099FF'}\``)
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
        
        } catch (error) {
            console.error('Setup command error:', error);
            
            // Check if interaction is still valid and not replied
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({ 
                        content: '❌ An error occurred while executing the setup command. Please try again.',
                        flags: ['Ephemeral']
                    });
                } catch (replyError) {
                    console.error('Failed to reply to interaction:', replyError);
                }
            } else if (interaction.deferred && !interaction.replied) {
                try {
                    await interaction.editReply({ 
                        content: '❌ An error occurred while executing the setup command. Please try again.'
                    });
                } catch (editError) {
                    console.error('Failed to edit reply:', editError);
                }
            }
        }
    }
};