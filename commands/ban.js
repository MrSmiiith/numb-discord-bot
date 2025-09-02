const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logEvent } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days = interaction.options.getInteger('days') || 0;
        
        const member = interaction.guild.members.cache.get(target.id);
        
        if (!member) {
            return interaction.reply({ content: 'User not found!', ephemeral: true });
        }
        
        if (!member.bannable) {
            return interaction.reply({ content: 'I cannot ban this user! They may have higher permissions.', ephemeral: true });
        }
        
        try {
            await member.ban({ deleteMessageDays: days, reason: reason });
            
            await logEvent(interaction.guild, 'BAN', {
                moderator: interaction.user.tag,
                target: target.tag,
                reason: reason,
                messageDeleteDays: days
            });
            
            await interaction.reply({ 
                content: `Successfully banned ${target.tag}\nReason: ${reason}\nDeleted ${days} days of messages`,
                ephemeral: false 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to ban the user!', ephemeral: true });
        }
    }
};