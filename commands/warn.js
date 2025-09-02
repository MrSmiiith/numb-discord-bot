const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('dm')
                .setDescription('Send warning via DM (default: true)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const sendDM = interaction.options.getBoolean('dm') ?? true;

        const member = interaction.guild.members.cache.get(target.id);
        if (!member) {
            return interaction.reply({
                content: '❌ User not found!',
                ephemeral: true
            });
        }

        const previousWarnings = await Log.count({
            where: {
                guildId: interaction.guild.id,
                userId: target.id,
                type: 'WARNING'
            }
        });
        const warnNumber = previousWarnings + 1;

        await Log.create({
            guildId: interaction.guild.id,
            type: 'WARNING',
            userId: target.id,
            userName: target.tag,
            moderatorId: interaction.user.id,
            moderatorName: interaction.user.tag,
            reason: reason,
            extra: { warnNumber: warnNumber }
        });

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('warning'))
            .setTitle('⚠️ User Warned')
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: '👤 User', value: `${target} (${target.tag})`, inline: true },
                { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                { name: '⚠️ Warning #', value: warnNumber.toString(), inline: true },
                { name: '📝 Reason', value: reason, inline: false }
            )
            .setFooter({ text: getServerName() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        if (sendDM) {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('warning'))
                    .setTitle(`⚠️ You have been warned in ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Warning #', value: warnNumber.toString(), inline: true },
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Note', value: 'Please follow the server rules to avoid further action.', inline: false }
                    )
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                await interaction.followUp({
                    content: '⚠️ Could not send DM to user (DMs may be disabled)',
                    ephemeral: true
                });
            }
        }

        if (warnNumber === 3) {
            await interaction.followUp('⚠️ User has reached 3 warnings. Consider further action.');
        } else if (warnNumber === 5) {
            await interaction.followUp('🚨 User has reached 5 warnings! Recommended: Timeout or temporary ban.');
        }
    }
};