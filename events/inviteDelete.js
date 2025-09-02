const { Events } = require('discord.js');

const guildInvites = new Map();

module.exports = {
    name: Events.InviteDelete,
    async execute(invite) {
        const invites = guildInvites.get(invite.guild.id);
        if (invites) {
            invites.delete(invite.code);
            guildInvites.set(invite.guild.id, invites);
        }

        console.log(`Invite deleted: ${invite.code}`);
    }
};