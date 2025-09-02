const { Events } = require('discord.js');

const guildInvites = new Map();

module.exports = {
    name: Events.InviteCreate,
    async execute(invite) {
        const invites = guildInvites.get(invite.guild.id) || new Map();
        invites.set(invite.code, invite.uses || 0);
        guildInvites.set(invite.guild.id, invites);

        console.log(`New invite created: ${invite.code} by ${invite.inviter?.tag || 'Unknown'}`);
    }
};