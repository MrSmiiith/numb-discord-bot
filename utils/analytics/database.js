const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const analyticsDb = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', '..', 'database', 'analytics.sqlite'),
    logging: false
});

const MessageAnalytics = analyticsDb.define('MessageAnalytics', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    characterCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    wordCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    hour: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});
const VoiceAnalytics = analyticsDb.define('VoiceAnalytics', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    joinTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    leaveTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});

const MemberFlow = analyticsDb.define('MemberFlow', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    inviterId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    inviteCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    accountAge: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    riskScore: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    hour: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});
const ChannelActivity = analyticsDb.define('ChannelActivity', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    uniqueUsers: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});

async function initAnalytics() {
    try {
        await analyticsDb.authenticate();
        await analyticsDb.sync();
        console.log('📊 Analytics database initialized');
    } catch (error) {
        console.error('Failed to initialize analytics database:', error);
    }
}

module.exports = {
    analyticsDb,
    MessageAnalytics,
    VoiceAnalytics,
    MemberFlow,
    ChannelActivity,
    initAnalytics
};