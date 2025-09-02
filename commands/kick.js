const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logEvent } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(target.id);
        
        if (!member) {
            return interaction.reply({ content: 'User not found!', ephemeral: true });
        }
        
        if (!member.kickable) {
            return interaction.reply({ content: 'I cannot kick this user! They may have higher permissions.', ephemeral: true });
        }
        
        try {
            await member.kick(reason);
            
            await logEvent(interaction.guild, 'KICK', {
                moderator: interaction.user.tag,
                target: target.tag,
                reason: reason
            });
            
            await interaction.reply({ 
                content: `Successfully kicked ${target.tag}\nReason: ${reason}`,
                ephemeral: false 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to kick the user!', ephemeral: true });
        }
    }
};