const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logEvent } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(target.id);

        if (!member) {
            return interaction.reply({ content: 'User not found!', ephemeral: true });
        }

        if (!member.moderatable) {
            return interaction.reply({ content: 'I cannot timeout this user! They may have higher permissions.', ephemeral: true });
        }

        try {
            await member.timeout(duration * 60 * 1000, reason);

            await logEvent(interaction.guild, 'TIMEOUT', {
                moderator: interaction.user.tag,
                target: target.tag,
                duration: `${duration} minutes`,
                reason: reason
            });

            await interaction.reply({
                content: `Successfully timed out ${target.tag} for ${duration} minutes\nReason: ${reason}`,
                ephemeral: false
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to timeout the user!', ephemeral: true });
        }
    }
};