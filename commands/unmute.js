const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logEvent } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to unmute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unmuting')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(target.id);
        
        if (!member) {
            return interaction.reply({ content: 'User not found!', ephemeral: true });
        }
        
        const mutedRole = interaction.guild.roles.cache.get(process.env.MUTED_ROLE_ID);
        
        if (!mutedRole) {
            return interaction.reply({ content: 'Muted role not found! Please configure it in .env', ephemeral: true });
        }
        
        if (!member.roles.cache.has(mutedRole.id)) {
            return interaction.reply({ content: 'User is not muted!', ephemeral: true });
        }
        
        try {
            await member.roles.remove(mutedRole);
            
            await logEvent(interaction.guild, 'UNMUTE', {
                moderator: interaction.user.tag,
                target: target.tag,
                reason: reason
            });
            
            await interaction.reply({ 
                content: `Successfully unmuted ${target.tag}\nReason: ${reason}`,
                ephemeral: false 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to unmute the user!', ephemeral: true });
        }
    }
};