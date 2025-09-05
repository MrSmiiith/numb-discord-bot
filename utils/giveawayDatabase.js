const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const giveawayDb = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database', 'giveaways.sqlite'),
    logging: false
});

const Giveaway = giveawayDb.define('Giveaway', {
    giveawayId: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hostId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hostName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    prize: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    winnersCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    requirements: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    ended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    cancelled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isDrop: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});
const GiveawayEntry = giveawayDb.define('GiveawayEntry', {
    giveawayId: {
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
    entryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    isBooster: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

const GiveawayWinner = giveawayDb.define('GiveawayWinner', {
    giveawayId: {
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
    prize: {
        type: DataTypes.STRING,
        allowNull: false
    },
    claimed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    rerolled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

async function initGiveaways() {
    try {
        await giveawayDb.authenticate();
        await giveawayDb.sync();
        console.log('🎉 Giveaway database initialized');
    } catch (error) {
        console.error('Failed to initialize giveaway database:', error);
    }
}

// Indexes are now defined in the model options, not added separately
// GiveawayEntry.addIndex(['giveawayId', 'userId'], { unique: true });
// Giveaway.addIndex(['guildId', 'ended']);

module.exports = {
    giveawayDb,
    Giveaway,
    GiveawayEntry,
    GiveawayWinner,
    initGiveaways
};