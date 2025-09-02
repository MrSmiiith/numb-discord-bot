const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { TempMute, Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempmute')
        .setDescription('Temporarily mute a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 10m, 1h, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for mute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = interaction.guild.members.cache.get(target.id);
        if (!member) {
            return interaction.reply({
                content: '❌ User not found!',
                ephemeral: true
            });
        }
        const duration = ms(durationStr);
        if (!duration || duration < 60000 || duration > 2419200000) {
            return interaction.reply({
                content: '❌ Invalid duration! Use format like: 10m, 1h, 1d (min: 1m, max: 28d)',
                ephemeral: true
            });
        }

        const mutedRole = interaction.guild.roles.cache.get(config.roles.moderation.muted);
        if (!mutedRole) {
            return interaction.reply({
                content: '❌ Muted role not found! Please configure it in config.js',
                ephemeral: true
            });
        }

        if (member.roles.cache.has(mutedRole.id)) {
            return interaction.reply({
                content: '❌ User is already muted!',
                ephemeral: true
            });
        }

        try {
            await member.roles.add(mutedRole);

            const expiresAt = new Date(Date.now() + duration);

            await TempMute.create({
                guildId: interaction.guild.id,
                userId: target.id,
                moderatorId: interaction.user.id,
                reason: reason,
                expiresAt: expiresAt
            });
            await Log.create({
                guildId: interaction.guild.id,
                type: 'TEMP_MUTE',
                userId: target.id,
                userName: target.tag,
                moderatorId: interaction.user.id,
                moderatorName: interaction.user.tag,
                reason: reason,
                duration: durationStr,
                expiresAt: expiresAt
            });

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('warning'))
                .setTitle('🔇 User Temporarily Muted')
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '👤 User', value: `${target} (${target.tag})`, inline: true },
                    { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                    { name: '⏱️ Duration', value: durationStr, inline: true },
                    { name: '📅 Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setFooter({ text: getServerName() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('warning'))
                    .setTitle(`You have been temporarily muted in ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Duration', value: durationStr, inline: true },
                        { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Could not DM user about temp mute');
            }
            setTimeout(async () => {
                try {
                    const updatedMember = await interaction.guild.members.fetch(target.id);
                    if (updatedMember && updatedMember.roles.cache.has(mutedRole.id)) {
                        await updatedMember.roles.remove(mutedRole);

                        await TempMute.update(
                            { active: false },
                            { where: { guildId: interaction.guild.id, userId: target.id, active: true } }
                        );

                        await Log.create({
                            guildId: interaction.guild.id,
                            type: 'AUTO_UNMUTE',
                            userId: target.id,
                            userName: target.tag,
                            reason: 'Temp mute expired'
                        });

                        console.log(`Auto-unmuted ${target.tag} after temp mute expired`);
                    }
                } catch (error) {
                    console.error('Error auto-unmuting user:', error);
                }
            }, duration);

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Failed to mute the user!',
                ephemeral: true
            });
        }
    }
};