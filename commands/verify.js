const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { logEvent } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify a user (Staff only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to verify')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('gender')
                .setDescription('Gender of the user')
                .setRequired(true)
                .addChoices(
                    { name: 'Boy', value: 'boy' },
                    { name: 'Girl', value: 'girl' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const gender = interaction.options.getString('gender');
        const member = interaction.guild.members.cache.get(target.id);

        if (!member) {
            return interaction.reply({ content: 'User not found!', ephemeral: true });
        }

        const unverifiedRole = interaction.guild.roles.cache.get(process.env.UNVERIFIED_ROLE_ID);
        const verifiedRole = interaction.guild.roles.cache.get(process.env.VERIFIED_ROLE_ID);
        const boyRole = interaction.guild.roles.cache.get(process.env.BOY_ROLE_ID);
        const girlRole = interaction.guild.roles.cache.get(process.env.GIRL_ROLE_ID);

        if (!unverifiedRole || !verifiedRole || !boyRole || !girlRole) {
            return interaction.reply({
                content: 'Verification roles not properly configured! Please check .env file.',
                ephemeral: true
            });
        }

        try {
            if (member.roles.cache.has(unverifiedRole.id)) {
                await member.roles.remove(unverifiedRole);
            }

            await member.roles.add(verifiedRole);

            if (gender === 'boy') {
                await member.roles.add(boyRole);
                if (member.roles.cache.has(girlRole.id)) {
                    await member.roles.remove(girlRole);
                }
            } else {
                await member.roles.add(girlRole);
                if (member.roles.cache.has(boyRole.id)) {
                    await member.roles.remove(boyRole);
                }
            }

            await logEvent(interaction.guild, 'VERIFY', {
                moderator: interaction.user.tag,
                target: target.tag,
                gender: gender
            });

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ User Verified')
                .setDescription(`${target.tag} has been successfully verified!`)
                .addFields(
                    { name: 'User', value: `<@${target.id}>`, inline: true },
                    { name: 'Gender', value: gender.charAt(0).toUpperCase() + gender.slice(1), inline: true },
                    { name: 'Verified by', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to verify the user!', ephemeral: true });
        }
    }
};