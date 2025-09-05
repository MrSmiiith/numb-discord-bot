const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        
        // Handle verification dashboard buttons
        if (interaction.customId === 'verification_guide') {
            const guideEmbed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle('📖 Staff Verification Guide')
                .setDescription(`
                    **Complete Guide to User Verification**
                    
                    **Step 1: Verification Alert**
                    • User joins verification voice channel
                    • System sends alert to this dashboard
                    • Alert includes user info & risk assessment
                    
                    **Step 2: Initial Assessment**
                    • Check account age (prefer 30+ days)
                    • Review join date and server activity
                    • Look for suspicious username/avatar
                    • Use \`/analytics @user\` for risk score
                    
                    **Step 3: Voice Verification**
                    • Join the voice channel with the user
                    • Verify their voice matches claimed age/gender
                    • Ask simple questions to confirm identity
                    • Be respectful but thorough
                    
                    **Step 4: Decision & Action**
                    • ✅ **Approve:** Use \`/verify @user boy/girl\`
                    • ❌ **Deny:** Explain reason and kick if needed
                    • ⚠️ **Suspicious:** Report to admin team
                    
                    **Red Flags to Watch For:**
                    🚨 Very new Discord accounts (under 7 days)
                    🚨 Refuses voice verification
                    🚨 Voice doesn't match claimed identity
                    🚨 Multiple verification attempts
                    🚨 Inappropriate username/avatar
                    🚨 High risk score from analytics
                `)
                .addFields(
                    { name: '⚡ Quick Commands', value: '\`/verify\` - Verify user\n\`/analytics\` - Risk assessment\n\`/warn\` - Issue warning\n\`/kick\` - Remove user', inline: true },
                    { name: '📊 Risk Levels', value: '🟢 **Low:** Safe to verify\n🟡 **Medium:** Extra caution\n🔴 **High:** Deny/investigate', inline: true },
                    { name: '🔒 Security Tips', value: '• Always verify in voice\n• Check account history\n• Trust your instincts\n• Report concerns to admins', inline: false }
                )
                .setFooter({ text: `${getServerName()} • Keep our community safe` })
                .setTimestamp();

            await interaction.reply({ embeds: [guideEmbed], ephemeral: true });
            
        } else if (interaction.customId === 'refresh_dashboard') {
            // Refresh the dashboard with current stats
            const guild = interaction.guild;
            const unverifiedRole = guild.roles.cache.get(config.roles.verification.unverified);
            const verifiedRole = guild.roles.cache.get(config.roles.verification.verified);
            
            const unverifiedCount = unverifiedRole ? unverifiedRole.members.size : 0;
            const verifiedCount = verifiedRole ? verifiedRole.members.size : 0;
            const totalMembers = guild.memberCount;
            
            const refreshEmbed = new EmbedBuilder()
                .setColor(getEmbedColor('success'))
                .setTitle('🔄 Dashboard Refreshed')
                .setDescription('Current server verification statistics:')
                .addFields(
                    { name: '👥 Total Members', value: totalMembers.toString(), inline: true },
                    { name: '✅ Verified Members', value: verifiedCount.toString(), inline: true },
                    { name: '⏳ Unverified Members', value: unverifiedCount.toString(), inline: true },
                    { name: '📊 Verification Rate', value: `${Math.round((verifiedCount / totalMembers) * 100)}%`, inline: true },
                    { name: '🎤 Voice Channels', value: config.channels.verification.voiceChannels.length.toString(), inline: true },
                    { name: '⏰ Last Update', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: `${getServerName()} • Live Statistics` })
                .setTimestamp();

            await interaction.reply({ embeds: [refreshEmbed], ephemeral: true });
            
        } else if (interaction.customId === 'verification_stats') {
            // Show detailed verification statistics
            try {
                const { Analytics } = require('../database/init');
                
                // Get recent verification activity (last 7 days)
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const recentActivity = await Analytics.count({
                    where: {
                        type: 'VERIFY',
                        createdAt: { [require('sequelize').Op.gte]: weekAgo }
                    }
                });

                const guild = interaction.guild;
                const verifiedRole = guild.roles.cache.get(config.roles.verification.verified);
                const boyRole = guild.roles.cache.get(config.roles.gender.boy);
                const girlRole = guild.roles.cache.get(config.roles.gender.girl);
                
                const statsEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('info'))
                    .setTitle('📊 Verification Statistics')
                    .setDescription('Detailed verification metrics for staff analysis')
                    .addFields(
                        { name: '📈 Recent Activity (7 days)', value: `${recentActivity} verifications`, inline: true },
                        { name: '✅ Total Verified', value: verifiedRole ? verifiedRole.members.size.toString() : '0', inline: true },
                        { name: '👦 Boys Verified', value: boyRole ? boyRole.members.size.toString() : '0', inline: true },
                        { name: '👧 Girls Verified', value: girlRole ? girlRole.members.size.toString() : '0', inline: true },
                        { name: '📅 Verification Channels', value: config.channels.verification.voiceChannels.length.toString(), inline: true },
                        { name: '🔔 Alert Channel', value: `<#${config.channels.verification.adminAlert}>`, inline: true },
                        { name: '⚡ System Status', value: '🟢 All systems operational', inline: false }
                    )
                    .setThumbnail(guild.iconURL())
                    .setFooter({ text: `${getServerName()} • Analytics Dashboard` })
                    .setTimestamp();

                await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
                
            } catch (error) {
                console.error('Error fetching verification stats:', error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('error'))
                    .setTitle('❌ Statistics Error')
                    .setDescription('Unable to fetch verification statistics at this time.')
                    .setFooter({ text: getServerName() })
                    .setTimestamp();

                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
