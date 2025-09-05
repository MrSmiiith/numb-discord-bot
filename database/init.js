const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'logs.sqlite'),
    logging: false
});

const Log = sequelize.define('Log', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    moderatorId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    moderatorName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    channelName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    messageContent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    oldContent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    newContent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    extra: {
        type: DataTypes.JSON,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});
const VoiceLog = sequelize.define('VoiceLog', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    channelName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    oldChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    oldChannelName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    newChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    newChannelName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});
const TempMute = sequelize.define('TempMute', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    moderatorId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    mutedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

const Ticket = sequelize.define('Ticket', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ticketId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'open'
    },
    claimedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    claimedByName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    closedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    closedByName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    closedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    transcriptUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    messageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastActivity: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    id: false  // Disable the default id field since we're using ticketId as primary key
});

const TicketMessage = sequelize.define('TicketMessage', {
    ticketId: {
        type: DataTypes.INTEGER,
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
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    attachments: {
        type: DataTypes.JSON,
        allowNull: true
    }
});
const Lockdown = sequelize.define('Lockdown', {
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
    initiatedBy: {
        type: DataTypes.STRING,
        allowNull: false
    },
    initiatedByName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    previousPermissions: {
        type: DataTypes.JSON,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        await sequelize.sync();
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = {
    sequelize,
    Log,
    VoiceLog,
    TempMute,
    Ticket,
    TicketMessage,
    Lockdown,
    initDatabase
};