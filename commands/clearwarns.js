const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Clear warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to clear warnings')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of warnings to clear (all if not specified)')
                .setRequired(false)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        const warnings = await Log.findAll({
            where: {
                guildId: interaction.guild.id,
                userId: target.id,
                type: 'WARNING'
            },
            order: [['createdAt', 'DESC']]
        });

        if (warnings.length === 0) {
            return interaction.reply({
                content: `❌ ${target.tag} has no warnings to clear.`,
                ephemeral: true
            });
        }
        let clearedCount = 0;

        if (amount) {
            const toDelete = warnings.slice(0, amount);
            for (const warn of toDelete) {
                await warn.destroy();
                clearedCount++;
            }
        } else {
            for (const warn of warnings) {
                await warn.destroy();
                clearedCount++;
            }
        }

        await Log.create({
            guildId: interaction.guild.id,
            type: 'WARNINGS_CLEARED',
            userId: target.id,
            userName: target.tag,
            moderatorId: interaction.user.id,
            moderatorName: interaction.user.tag,
            extra: { clearedCount: clearedCount }
        });

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('success'))
            .setTitle('✅ Warnings Cleared')
            .setDescription(`Cleared ${clearedCount} warning(s) for ${target}`)
            .addFields(
                { name: 'User', value: target.tag, inline: true },
                { name: 'Cleared by', value: interaction.user.tag, inline: true },
                { name: 'Warnings Cleared', value: clearedCount.toString(), inline: true }
            )
            .setFooter({ text: getServerName() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};