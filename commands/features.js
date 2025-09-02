const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBranding } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('features')
        .setDescription('View NUMB SYSTEM capabilities'),
    
    async execute(interaction) {
        const branding = getBranding();
        
        const embed = new EmbedBuilder()
            .setColor('#000000') // NUMB SYSTEM black theme
            .setTitle(`⚡ NUMB SYSTEM - Feature Matrix`)
            .setDescription('**Silent. Efficient. Unstoppable.**\n\nComplete server control infrastructure at your command.')
            .addFields(
                { 
                    name: '💀 Enforcement Systems', 
                    value: `• Advanced Warning Protocol
                    • Instant Punishment Deployment
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
                    value: `• Voice Verification Protocol
                    • Reaction Role Assignment
                    • Professional Ticket System
                    • Giveaway Distribution
                    • Channel Lockdown
                    • Message Purge Protocol
                    • \`/verify\` \`/reactionroles\` \`/ticket\``,
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
                }
            )
            .setFooter({ text: `NUMB SYSTEM v2.0 • By MrSmith • Feel Nothing. Control Everything.` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
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
                    name: '🎭 Reaction Roles', 
                    value: `• Pre-configured panels (colors, games, notifications, pronouns)
                    • Button or dropdown styles
                    • Exclusive roles (one from group)
                    • Multiple selection support
                    • Config-based setup
                    • \`/reactionroles create\` to setup!`,
                    inline: false 
                },
                { 
                    name: '📊 Advanced Analytics', 
                    value: `• Activity heatmaps
                    • Channel statistics
                    • Member engagement tracking
                    • Growth analytics
                    • Raid detection system
                    • \`/analytics\` to view!`,
                    inline: false 
                },
                { 
                    name: '🤫 Confession System', 
                    value: `• Anonymous confessions
                    • Numbered for reference
                    • Admin reveal capability
                    • \`/confess submit\` to use!`,
                    inline: false 
                },
                { 
                    name: '🎮 Fun Commands', 
                    value: `• Random facts & jokes
                    • Inspirational quotes
                    • Would You Rather game
                    • Truth or Dare
                    • \`/fun\` to play!`,
                    inline: false 
                }
            )
            .setFooter({ text: `${getServerName()} • Bot Version 2.0.0` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};