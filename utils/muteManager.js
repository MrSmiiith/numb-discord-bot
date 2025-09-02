const { TempMute, Log } = require('../database/init');
const config = require('../config');

class MuteManager {
    constructor(client) {
        this.client = client;
        this.checkInterval = 60000;
    }

    start() {
        this.checkExpiredMutes();

        setInterval(() => {
            this.checkExpiredMutes();
        }, this.checkInterval);

        console.log('✅ Mute manager started - checking for expired mutes every minute');
    }

    async checkExpiredMutes() {
        try {
            const now = new Date();

            const expiredMutes = await TempMute.findAll({
                where: {
                    active: true,
                    expiresAt: { [require('sequelize').Op.lte]: now }
                }
            });

            for (const mute of expiredMutes) {
                await this.unmuteMember(mute);
            }

            if (expiredMutes.length > 0) {
                console.log(`Processed ${expiredMutes.length} expired mutes`);
            }
        } catch (error) {
            console.error('Error checking expired mutes:', error);
        }
    }
    async unmuteMember(mute) {
        try {
            const guild = this.client.guilds.cache.get(mute.guildId);
            if (!guild) return;

            const member = await guild.members.fetch(mute.userId).catch(() => null);
            if (!member) {
                mute.active = false;
                await mute.save();
                return;
            }

            const mutedRole = guild.roles.cache.get(config.roles.moderation.muted);
            if (!mutedRole) return;

            if (member.roles.cache.has(mutedRole.id)) {
                await member.roles.remove(mutedRole);

                console.log(`Auto-unmuted ${member.user.tag} in ${guild.name}`);

                await Log.create({
                    guildId: guild.id,
                    type: 'AUTO_UNMUTE',
                    userId: member.id,
                    userName: member.user.tag,
                    reason: 'Temp mute expired',
                    extra: {
                        originalModerator: mute.moderatorId,
                        muteDuration: Math.round((mute.expiresAt - mute.mutedAt) / 60000) + ' minutes'
                    }
                });

                try {
                    await member.send(`Your temporary mute in **${guild.name}** has expired. You can now send messages again.`);
                } catch (error) {
                }
            }

            mute.active = false;
            await mute.save();

        } catch (error) {
            console.error(`Error unmuting member ${mute.userId}:`, error);
        }
    }
}

module.exports = MuteManager;