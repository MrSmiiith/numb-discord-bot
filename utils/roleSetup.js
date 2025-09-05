const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

async function setupMutedRole(guild) {
    let mutedRole = guild.roles.cache.get(config.roles.moderation.muted);

    if (!mutedRole) {
        try {
            mutedRole = await guild.roles.create({
                name: 'Muted',
                color: '#808080',
                permissions: [],
                reason: 'Auto-created muted role for moderation'
            });

            console.log(`Created muted role in ${guild.name}`);

            guild.channels.cache.forEach(async (channel) => {
                try {
                    await channel.permissionOverwrites.create(mutedRole, {
                        SendMessages: false,
                        SendMessagesInThreads: false,
                        CreatePublicThreads: false,
                        CreatePrivateThreads: false,
                        AddReactions: false,
                        Speak: false,
                        Stream: false,
                        UseVAD: false
                    });
                } catch (error) {
                    console.error(`Failed to set permissions in ${channel.name}:`, error);
                }
            });
            console.log(`Updated permissions for muted role in all channels`);

        } catch (error) {
            console.error('Failed to create muted role:', error);
        }
    }

    return mutedRole;
}

async function verifyRoles(guild) {
    const requiredRoles = {
        UNVERIFIED_ROLE_ID: config.roles.verification.unverified,
        VERIFIED_ROLE_ID: config.roles.verification.verified,
        BOY_ROLE_ID: config.roles.gender.boy,
        GIRL_ROLE_ID: config.roles.gender.girl,
        MUTED_ROLE_ID: config.roles.moderation.muted,
        ADMIN_ROLE_ID: config.roles.staff.admin,
        STAFF_ROLE_ID: config.roles.staff.moderator
    };

    const missingRoles = [];

    for (const [name, id] of Object.entries(requiredRoles)) {
        if (id && !guild.roles.cache.has(id)) {
            missingRoles.push(name);
        }
    }

    if (missingRoles.length > 0) {
        console.warn(`Missing roles in ${guild.name}: ${missingRoles.join(', ')}`);
        console.warn('Please update your config.js file with the correct role IDs');
    }

    return missingRoles.length === 0;
}

module.exports = { setupMutedRole, verifyRoles };