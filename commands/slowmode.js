const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set channel slowmode')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Slowmode duration in seconds (0 to disable)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to set slowmode (current if not specified)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for slowmode')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            await channel.setRateLimitPerUser(seconds, reason);

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor(seconds > 0 ? 'warning' : 'success'))
                .setTitle(seconds > 0 ? '🐌 Slowmode Enabled' : '⚡ Slowmode Disabled')
                .addFields(
                    { name: 'Channel', value: `${channel}`, inline: true },
                    { name: 'Duration', value: seconds > 0 ? `${seconds} seconds` : 'Disabled', inline: true },
                    { name: 'Set by', value: interaction.user.tag, inline: true }
                );

            if (seconds > 0 && reason !== 'No reason provided') {
                embed.addFields({ name: 'Reason', value: reason, inline: false });
            }

            embed.setFooter({ text: getServerName() }).setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Failed to set slowmode!',
                ephemeral: true
            });
        }
    }
};