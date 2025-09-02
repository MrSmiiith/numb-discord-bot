const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement to a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send announcement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Announcement message')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Announcement title')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('ping')
                .setDescription('Role to ping')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('everyone')
                .setDescription('Ping @everyone')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Embed color (hex)')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image to attach')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');
        const title = interaction.options.getString('title') || 'Announcement';
        const pingRole = interaction.options.getRole('ping');
        const pingEveryone = interaction.options.getBoolean('everyone');
        const color = interaction.options.getString('color');
        const image = interaction.options.getAttachment('image');

        const embed = new EmbedBuilder()
            .setTitle(`📢 ${title}`)
            .setDescription(message)
            .setFooter({ text: `${getServerName()} • Announced by ${interaction.user.tag}` })
            .setTimestamp();

        if (color && /^#[0-9A-F]{6}$/i.test(color)) {
            embed.setColor(color);
        } else {
            embed.setColor(getEmbedColor('info'));
        }

        if (image) {
            embed.setImage(image.url);
        }

        let pingMessage = '';
        if (pingEveryone) {
            pingMessage = '@everyone ';
        } else if (pingRole) {
            pingMessage = `<@&${pingRole.id}> `;
        }

        try {
            await channel.send({
                content: pingMessage || null,
                embeds: [embed]
            });

            await interaction.reply({
                content: `✅ Announcement sent to ${channel}!`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: '❌ Failed to send announcement! Check my permissions in that channel.',
                ephemeral: true
            });
        }
    }
};