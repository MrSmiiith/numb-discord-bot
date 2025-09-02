const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage user roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get information about a role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to get info about')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'add') {
            const user = interaction.options.getUser('user');
            const role = interaction.options.getRole('role');
            const member = interaction.guild.members.cache.get(user.id);
            
            if (!member) {
                return interaction.reply({ content: '❌ User not found!', ephemeral: true });
            }
            
            if (member.roles.cache.has(role.id)) {
                return interaction.reply({ content: `❌ ${user.tag} already has the ${role.name} role!`, ephemeral: true });
            }
            
            try {
                await member.roles.add(role);
                
                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('success'))
                    .setTitle('✅ Role Added')
                    .setDescription(`Added ${role} to ${user}`)
                    .addFields(
                        { name: 'User', value: user.tag, inline: true },
                        { name: 'Role', value: role.name, inline: true },
                        { name: 'Added by', value: interaction.user.tag, inline: true }
                    )
                    .setFooter({ text: getServerName() })
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                await interaction.reply({ content: '❌ Failed to add role! I may not have permission to manage this role.', ephemeral: true });
            }            
        } else if (subcommand === 'remove') {
            const user = interaction.options.getUser('user');
            const role = interaction.options.getRole('role');
            const member = interaction.guild.members.cache.get(user.id);
            
            if (!member) {
                return interaction.reply({ content: '❌ User not found!', ephemeral: true });
            }
            
            if (!member.roles.cache.has(role.id)) {
                return interaction.reply({ content: `❌ ${user.tag} doesn't have the ${role.name} role!`, ephemeral: true });
            }
            
            try {
                await member.roles.remove(role);
                
                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('warning'))
                    .setTitle('✅ Role Removed')
                    .setDescription(`Removed ${role} from ${user}`)
                    .addFields(
                        { name: 'User', value: user.tag, inline: true },
                        { name: 'Role', value: role.name, inline: true },
                        { name: 'Removed by', value: interaction.user.tag, inline: true }
                    )
                    .setFooter({ text: getServerName() })
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                await interaction.reply({ content: '❌ Failed to remove role! I may not have permission to manage this role.', ephemeral: true });
            }            
        } else if (subcommand === 'info') {
            const role = interaction.options.getRole('role');
            
            const permissions = role.permissions.toArray().map(p => 
                p.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
            );
            
            const embed = new EmbedBuilder()
                .setColor(role.hexColor || getEmbedColor('info'))
                .setTitle(`📋 Role Information - ${role.name}`)
                .addFields(
                    { name: 'Name', value: role.name, inline: true },
                    { name: 'ID', value: role.id, inline: true },
                    { name: 'Color', value: role.hexColor || 'None', inline: true },
                    { name: 'Position', value: role.position.toString(), inline: true },
                    { name: 'Members', value: role.members.size.toString(), inline: true },
                    { name: 'Mentionable', value: role.mentionable ? '✅ Yes' : '❌ No', inline: true },
                    { name: 'Hoisted', value: role.hoist ? '✅ Yes' : '❌ No', inline: true },
                    { name: 'Managed', value: role.managed ? '✅ Yes' : '❌ No', inline: true },
                    { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`, inline: true }
                );
            
            if (permissions.length > 0) {
                embed.addFields({ 
                    name: 'Permissions', 
                    value: permissions.slice(0, 15).join(', ') + (permissions.length > 15 ? ` and ${permissions.length - 15} more...` : ''), 
                    inline: false 
                });
            }
            
            embed.setFooter({ text: getServerName() }).setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};