const { Events, EmbedBuilder } = require('discord.js');
const { logEvent } = require('../utils/logger');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

const dashboardMessages = new Map();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isStringSelectMenu()) return;

        if (interaction.customId.startsWith('gender_')) {
            const userId = interaction.customId.split('_')[1];
            const gender = interaction.values[0];
            const member = interaction.guild.members.cache.get(userId);

            if (!member) {
                return interaction.reply({ content: 'User not found! They may have left the server.', ephemeral: true });
            }

            const staffRole = interaction.guild.roles.cache.get(config.roles.staff.moderator);
            const adminRole = interaction.guild.roles.cache.get(config.roles.staff.admin);

            if (!interaction.member.roles.cache.has(staffRole?.id) && !interaction.member.roles.cache.has(adminRole?.id)) {
                return interaction.reply({
                    content: '❌ You do not have permission to verify users! Only staff members can use this dashboard.',
                    ephemeral: true
                });
            }
            const unverifiedRole = interaction.guild.roles.cache.get(config.roles.verification.unverified);
            const verifiedRole = interaction.guild.roles.cache.get(config.roles.verification.verified);
            const boyRole = interaction.guild.roles.cache.get(config.roles.gender.boy);
            const girlRole = interaction.guild.roles.cache.get(config.roles.gender.girl);

            if (!unverifiedRole || !verifiedRole || !boyRole || !girlRole) {
                return interaction.reply({
                    content: '⚠️ Verification roles not properly configured! Please check config.js file.',
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
                    target: member.user.tag,
                    gender: gender
                });

                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('success'))
                    .setTitle(`✅ ${getServerName()} - User Verified Successfully`)
                    .setDescription(`${member.user.tag} has been verified and can now access the server!`)
                    .addFields(
                        { name: '👤 User', value: `<@${member.id}>`, inline: true },
                        { name: '⚧ Gender', value: gender.charAt(0).toUpperCase() + gender.slice(1), inline: true },
                        { name: '✅ Verified by', value: interaction.user.tag, inline: true }
                    )
                    .setThumbnail(member.user.displayAvatarURL())
                    .setFooter({ text: getServerName() })
                    .setTimestamp();

                await interaction.update({
                    embeds: [embed],
                    components: []
                });

                if (dashboardMessages.has(userId)) {
                    dashboardMessages.delete(userId);
                }
                try {
                    const userEmbed = new EmbedBuilder()
                        .setColor(getEmbedColor('success'))
                        .setTitle(`✅ Welcome to ${getServerName()}!`)
                        .setDescription(`You have been successfully verified and now have full access to the server!`)
                        .addFields(
                            { name: '✅ Verified by', value: interaction.user.tag, inline: true },
                            { name: '⚧ Role assigned', value: gender.charAt(0).toUpperCase() + gender.slice(1), inline: true }
                        )
                        .setFooter({ text: `${getServerName()} • Enjoy your stay!` })
                        .setTimestamp();

                    await member.send({ embeds: [userEmbed] });
                } catch (error) {
                    console.log('Could not send DM to verified user');
                }

            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Failed to verify the user! Please try again.', ephemeral: true });
            }
        }
        if (interaction.customId.startsWith('action_')) {
            const userId = interaction.customId.split('_')[1];
            const action = interaction.values[0];
            const member = interaction.guild.members.cache.get(userId);

            const staffRole = interaction.guild.roles.cache.get(config.roles.staff.moderator);
            const adminRole = interaction.guild.roles.cache.get(config.roles.staff.admin);

            if (!interaction.member.roles.cache.has(staffRole?.id) && !interaction.member.roles.cache.has(adminRole?.id)) {
                return interaction.reply({
                    content: '❌ You do not have permission to perform this action!',
                    ephemeral: true
                });
            }

            if (action === 'cancel') {
                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('warning'))
                    .setTitle(`⚠️ Verification Cancelled`)
                    .setDescription(`Verification session for ${member?.user.tag || 'user'} was cancelled by ${interaction.user.tag}`)
                    .setFooter({ text: getServerName() })
                    .setTimestamp();

                await interaction.update({
                    embeds: [embed],
                    components: []
                });
                if (dashboardMessages.has(userId)) {
                    dashboardMessages.delete(userId);
                }

            } else if (action === 'reject') {
                if (!member) {
                    return interaction.reply({ content: 'User not found!', ephemeral: true });
                }

                if (member.voice.channel) {
                    await member.voice.disconnect('Verification rejected');
                }

                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('error'))
                    .setTitle(`🚫 Verification Rejected`)
                    .setDescription(`${member.user.tag} was rejected and disconnected from voice by ${interaction.user.tag}`)
                    .setFooter({ text: getServerName() })
                    .setTimestamp();

                await interaction.update({
                    embeds: [embed],
                    components: []
                });

                if (dashboardMessages.has(userId)) {
                    dashboardMessages.delete(userId);
                }

                await logEvent(interaction.guild, 'VERIFICATION_REJECTED', {
                    moderator: interaction.user.tag,
                    target: member.user.tag
                });
            }
        }
    },
};