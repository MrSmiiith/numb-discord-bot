const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check warnings')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const target = interaction.options.getUser('user');
        
        const warnings = await Log.findAll({
            where: {
                guildId: interaction.guild.id,
                userId: target.id,
                type: 'WARNING'
            },
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        if (warnings.length === 0) {
            return interaction.reply({
                content: `✅ ${target.tag} has no warnings.`,
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('warning'))
            .setTitle(`⚠️ Warnings for ${target.tag}`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(`Total warnings: **${warnings.length}**`)
            .setFooter({ text: getServerName() })
            .setTimestamp();
        
        warnings.forEach((warn, index) => {
            const warnDate = new Date(warn.createdAt).toLocaleDateString();
            embed.addFields({
                name: `Warning #${warnings.length - index} - ${warnDate}`,
                value: `**Reason:** ${warn.reason}\n**By:** ${warn.moderatorName}`,
                inline: false
            });
        });
        
        await interaction.reply({ embeds: [embed] });
    }
};