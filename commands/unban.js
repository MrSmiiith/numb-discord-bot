const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logEvent } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The user ID to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            await interaction.guild.members.unban(userId, reason);
            
            await logEvent(interaction.guild, 'UNBAN', {
                moderator: interaction.user.tag,
                targetId: userId,
                reason: reason
            });
            
            await interaction.reply({ 
                content: `Successfully unbanned user with ID: ${userId}\nReason: ${reason}`,
                ephemeral: false 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to unban the user! Make sure the user ID is correct and they are banned.', ephemeral: true });
        }
    }
};