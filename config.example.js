module.exports = {
    // Bot Credentials - REQUIRED
    bot: {
        token: 'YOUR_BOT_TOKEN_HERE', // Get from Discord Developer Portal
        clientId: 'YOUR_CLIENT_ID_HERE', // Bot Application ID
        guildId: 'YOUR_GUILD_ID_HERE' // Your Server ID
    },

    // Bot Branding
    branding: {
        botName: 'NUMB SYSTEM',
        serverName: 'Your Server Name',
        embedColor: '#000000', // Black theme for NUMB SYSTEM
        footer: 'NUMB SYSTEM v2.0 | By MrSmith',
        developer: {
            name: 'MrSmith',
            website: 'https://merzougrayane.com',
            github: 'https://github.com/MrSmiiith',
            email: 'contact@merzougrayane.com'
        }
    },

    // Channel IDs - REQUIRED
    channels: {
        logs: {
            general: 'CHANNEL_ID', // General logs
            voice: 'CHANNEL_ID', // Voice logs
            message: 'CHANNEL_ID', // Message logs
            moderation: 'CHANNEL_ID', // Mod logs
            tickets: 'CHANNEL_ID' // Ticket logs
        },
        verification: {
            adminAlert: 'CHANNEL_ID', // Admin alerts
            dashboard: 'CHANNEL_ID', // Staff dashboard
            voiceChannels: [
                'CHANNEL_ID_1',
                'CHANNEL_ID_2',
                'CHANNEL_ID_3',
                'CHANNEL_ID_4'
            ]
        },
        tickets: {
            category: 'CATEGORY_ID', // Ticket category
            transcripts: 'CHANNEL_ID' // Transcripts
        },
        confessions: 'CHANNEL_ID' // Confession channel
    },

    // Role IDs - REQUIRED
    roles: {
        staff: {
            admin: 'ROLE_ID',
            moderator: 'ROLE_ID'
        },
        verification: {
            unverified: 'ROLE_ID',
            verified: 'ROLE_ID'
        },
        gender: {
            boy: 'ROLE_ID',
            girl: 'ROLE_ID'
        },
        moderation: {
            muted: 'ROLE_ID'
        }
    },

    // Features - Optional
    features: {
        autoAssignUnverified: true,
        dmOnVerification: true,
        logBotMessages: false,
        autoCreateMutedRole: true,
        verificationAlertMentions: true,
        autoReactions: true
    },

    // Auto-Reactions - Optional
    autoReactions: {
        enabled: true,
        channels: [
            {
                channelId: 'CHANNEL_ID',
                reactions: ['👍', '❤️'],
                reactToBot: false,
                reactToUsers: true
            }
        ]
    },

    // Reaction Roles - Optional
    reactionRoles: {
        colors: {
            title: '🎨 Color Roles',
            description: 'Select your color',
            style: 'buttons',
            exclusive: true,
            roles: [
                { id: 'ROLE_ID', label: 'Red', emoji: '🔴' },
                { id: 'ROLE_ID', label: 'Blue', emoji: '🔵' },
                { id: 'ROLE_ID', label: 'Green', emoji: '🟢' }
            ]
        }
    }
};