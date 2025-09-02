const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

let confessionCount = 0;
const confessionAuthors = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confess')
        .setDescription('Submit an anonymous confession')
        .addSubcommand(subcommand =>
            subcommand
                .setName('submit')
                .setDescription('Submit a confession anonymously'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup confession channel (Admin only)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reveal')
                .setDescription('Reveal confession author (Admin only)')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Confession ID to reveal')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'submit') {
            const modal = new ModalBuilder()
                .setCustomId('confession_modal')
                .setTitle('Anonymous Confession');

            const confessionInput = new TextInputBuilder()
                .setCustomId('confession_text')
                .setLabel('Your Confession')
                .setPlaceholder('Type your confession here... (min 10 characters)')
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(10)
                .setMaxLength(1000)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(confessionInput);
            modal.addComponents(row);

            await interaction.showModal(modal);

        } else if (subcommand === 'setup') {
            await this.setupConfession(interaction);

        } else if (subcommand === 'reveal') {
            await this.revealConfession(interaction);
        }
    },
    async setupConfession(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Only administrators can setup confession channel!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('🤫 Anonymous Confessions')
            .setDescription(`
                **Share your thoughts anonymously!**

                Use \`/confess submit\` to share a confession.

                **Rules:**
                • Keep it appropriate
                • No hate speech or harassment
                • No illegal content
                • No personal information
                • Minimum 10 characters

                *Admins can reveal authors if rules are broken*
            `)
            .setFooter({ text: `${getServerName()} • Confessions are anonymous` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async revealConfession(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Only administrators can reveal confession authors!',
                ephemeral: true
            });
        }

        const confessionId = interaction.options.getInteger('id');
        const author = confessionAuthors.get(confessionId);

        if (!author) {
            return interaction.reply({
                content: `❌ No confession found with ID #${confessionId}`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('warning'))
            .setTitle('🔍 Confession Revealed')
            .setDescription(`Confession #${confessionId} was submitted by:`)
            .addFields(
                { name: 'Author', value: `<@${author.id}> (${author.tag})`, inline: true },
                { name: 'User ID', value: author.id, inline: true },
                { name: 'Submitted', value: `<t:${Math.floor(author.timestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'This information is confidential - use responsibly' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};