const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logEvent } = require('../utils/logger');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for muting')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(target.id);
        
        if (!member) {
            return interaction.reply({ content: 'User not found!', ephemeral: true });
        }
        
        const mutedRole = interaction.guild.roles.cache.get(config.roles.moderation.muted);
        
        if (!mutedRole) {
            return interaction.reply({ content: 'Muted role not found! Please configure it in config.js', ephemeral: true });
        }        
        if (member.roles.cache.has(mutedRole.id)) {
            return interaction.reply({ content: 'User is already muted!', ephemeral: true });
        }
        
        try {
            await member.roles.add(mutedRole);
            
            await logEvent(interaction.guild, 'MUTE', {
                moderator: interaction.user.tag,
                target: target.tag,
                reason: reason
            });
            
            await interaction.reply({ 
                content: `Successfully muted ${target.tag}\nReason: ${reason}`,
                ephemeral: false 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to mute the user!', ephemeral: true });
        }
    }
};