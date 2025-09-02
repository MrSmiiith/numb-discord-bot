const { Events } = require('discord.js');
const config = require('../config');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isButton() && interaction.customId.startsWith('role_')) {
            await handleButtonRole(interaction);
        }

        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('roleselect_')) {
            await handleDropdownRoles(interaction);
        }
    }
};

async function handleButtonRole(interaction) {
    const [, panelType, roleId] = interaction.customId.split('_');

    const panelConfig = config.reactionRoles?.[panelType];
    if (!panelConfig) {
        return interaction.reply({
            content: '❌ Configuration error! Panel type not found.',
            ephemeral: true
        });
    }

    const roleConfig = panelConfig.roles.find(r => r.id === roleId);
    if (!roleConfig) {
        return interaction.reply({
            content: '❌ Role configuration not found!',
            ephemeral: true
        });
    }

    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) {
        return interaction.reply({
            content: '❌ Role not found in server!',
            ephemeral: true
        });
    }

    if (interaction.member.roles.cache.has(roleId)) {
        await interaction.member.roles.remove(role);
        await interaction.reply({
            content: `✅ Removed role: **${role.name}**`,
            ephemeral: true
        });
    } else {
        if (panelConfig.exclusive) {
            for (const otherRole of panelConfig.roles) {
                if (otherRole.id !== roleId && interaction.member.roles.cache.has(otherRole.id)) {
                    await interaction.member.roles.remove(otherRole.id).catch(() => {});
                }
            }
        }

        await interaction.member.roles.add(role);
        await interaction.reply({
            content: `✅ Added role: **${role.name}**`,
            ephemeral: true
        });
    }
}
async function handleDropdownRoles(interaction) {
    const panelType = interaction.customId.replace('roleselect_', '');

    const panelConfig = config.reactionRoles?.[panelType];
    if (!panelConfig) {
        return interaction.reply({
            content: '❌ Configuration error! Panel type not found.',
            ephemeral: true
        });
    }

    const selectedRoleIds = interaction.values;
    const memberRoles = interaction.member.roles.cache;

    const panelRoleIds = panelConfig.roles.map(r => r.id);

    const toAdd = [];
    const toRemove = [];

    for (const roleId of panelRoleIds) {
        if (selectedRoleIds.includes(roleId) && !memberRoles.has(roleId)) {
            toAdd.push(roleId);
        } else if (!selectedRoleIds.includes(roleId) && memberRoles.has(roleId)) {
            toRemove.push(roleId);
        }
    }

    const addedNames = [];
    const removedNames = [];

    for (const roleId of toAdd) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (role) {
            await interaction.member.roles.add(role).catch(() => {});
            addedNames.push(role.name);
        }
    }

    for (const roleId of toRemove) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (role) {
            await interaction.member.roles.remove(role).catch(() => {});
            removedNames.push(role.name);
        }
    }

    let response = '';
    if (addedNames.length > 0) {
        response += `✅ **Added:** ${addedNames.join(', ')}\n`;
    }
    if (removedNames.length > 0) {
        response += `❌ **Removed:** ${removedNames.join(', ')}\n`;
    }
    if (!response) {
        response = 'No changes made to your roles.';
    }

    await interaction.reply({
        content: response.trim(),
        ephemeral: true
    });
}