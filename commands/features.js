const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('features')
        .setDescription('Display all NUMB SYSTEM features'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('⚡ NUMB SYSTEM - Complete Feature Overview')
            .setDescription('**Feel Nothing. Control Everything.**\n\n🔥 *Advanced Discord Management at Its Finest*')
            .addFields(
                { 
                    name: '🛡️ Enforcement Arsenal', 
                    value: `• Advanced Warning System
                    • Auto-Escalation Protocol  
                    • Temporary Mute System
                    • Permanent Ban Hammer
                    • Shadow Moderation
                    • Raid Annihilation
                    • \`/warn\` \`/mute\` \`/ban\` \`/kick\``,
                    inline: false 
                },
                { 
                    name: '🔍 Intelligence Gathering', 
                    value: `• Complete Message Analytics
                    • User Behavior Profiling
                    • Risk Assessment Algorithm
                    • Pattern Recognition
                    • Invite Tracking System
                    • Member Flow Analysis
                    • \`/analytics\` \`/userinfo\` \`/modlogs\``,
                    inline: false 
                },
                { 
                    name: '🎯 Control Systems', 
                    value: `• Verification Management
                    • Auto-Role Assignment
                    • Channel Lockdown
                    • Message Purging
                    • Slowmode Control
                    • Permission Override
                    • \`/verify\` \`/lockdown\` \`/purge\``,
                    inline: false 
                },
                { 
                    name: '🎫 Advanced Ticketing', 
                    value: `• Category-Based Organization
                    • Staff Assignment System
                    • Rating & Feedback
                    • Transcript Generation
                    • Auto-Close Timers
                    • Performance Analytics
                    • \`/ticket\` commands`,
                    inline: false 
                },
                { 
                    name: '👻 Stealth Features', 
                    value: `• Anonymous Confession Box
                    • Hidden Logging System
                    • Silent Auto-Moderation
                    • Background Analytics
                    • Ghost Mode Operations
                    • \`/confess\` \`/analytics\``,
                    inline: false 
                },
                { 
                    name: '🎮 Psychological Operations', 
                    value: `• Truth or Dare System
                    • Would You Rather
                    • Random Generators
                    • Fun Facts Database
                    • \`/fun\` commands`,
                    inline: false 
                },
                { 
                    name: '🎉 Giveaway System', 
                    value: `• Timed giveaways with auto-draw
                    • Multiple winners support
                    • Requirements (roles, messages)
                    • Booster multipliers (2x entries)
                    • Drop giveaways (first to react)
                    • Reroll system
                    • \`/giveaway start\` to begin!`,
                    inline: false 
                },
                { 
                    name: '⚙️ Configuration', 
                    value: `• Setup wizard
                    • Configuration validation
                    • Backup & restore
                    • Feature toggles
                    • \`/setup\` \`/backup\``,
                    inline: false 
                }
            )
            .setFooter({ text: `NUMB SYSTEM v2.0 • By MrSmith • Feel Nothing. Control Everything.` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};