const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const pjson = require('../package.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About NUMB SYSTEM and its developer'),
    
    async execute(interaction) {
        const client = interaction.client;
        
        // Calculate bot statistics
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        const embed = new EmbedBuilder()
            .setColor('#000000') // Black theme for NUMB SYSTEM
            .setTitle('⚡ NUMB SYSTEM - Advanced Discord Management')
            .setDescription(`
                **NUMB SYSTEM** is a cutting-edge Discord bot engineered for complete server control and automation.
                
                Featuring state-of-the-art moderation tools, analytics, and community management systems. 
                NUMB SYSTEM operates silently but effectively - protecting your server 24/7.
            `)
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { 
                    name: '👨‍💻 Developer', 
                    value: `**${config.branding.developer.name}**\n[Website](${config.branding.developer.website}) | [GitHub](${config.branding.developer.github})`, 
                    inline: true 
                },
                { 
                    name: '📊 Statistics', 
                    value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${totalUsers.toLocaleString()}\n**Uptime:** ${days}d ${hours}h ${minutes}m`, 
                    inline: true 
                },
                { 
                    name: '🔧 Technical', 
                    value: `**Version:** ${pjson.version}\n**Discord.js:** v14.14.1\n**Node.js:** ${process.version}`, 
                    inline: true 
                },
                { 
                    name: '⚡ Core Systems', 
                    value: `
                        • Advanced Moderation Engine
                        • Professional Ticket System
                        • Voice Verification Protocol
                        • Giveaway Management
                        • Reaction Role Assignment
                        • Analytics & Tracking
                        • Auto-Moderation AI
                        • Anonymous Confession System
                        • Entertainment Module
                    `, 
                    inline: false 
                },
                { 
                    name: '🎯 System Protocol', 
                    value: `*"Silent. Efficient. Unstoppable. NUMB SYSTEM protects your community with zero tolerance for disruption."*`, 
                    inline: false 
                }
            )
            .setFooter({ 
                text: `NUMB SYSTEM © 2024 ${config.branding.developer.name}`, 
                iconURL: client.user.displayAvatarURL() 
            })
            .setTimestamp();
        
        // Create buttons
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL(config.branding.developer.website)
                    .setEmoji('🌐'),
                new ButtonBuilder()
                    .setLabel('GitHub')
                    .setStyle(ButtonStyle.Link)
                    .setURL(config.branding.developer.github)
                    .setEmoji('📂'),
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
                    .setEmoji('➕'),
                new ButtonBuilder()
                    .setLabel('Support')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`mailto:${config.branding.developer.email}`)
                    .setEmoji('📧')
            );
        
        await interaction.reply({ embeds: [embed], components: [buttons] });
    }
};