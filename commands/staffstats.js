const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staffstats')
        .setDescription('View staff member activity statistics')
        .addUserOption(option =>
            option.setName('staff')
                .setDescription('Staff member to check')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('period')
                .setDescription('Time period')
                .setRequired(false)
                .addChoices(
                    { name: 'Today', value: 'today' },
                    { name: 'This Week', value: 'week' },
                    { name: 'This Month', value: 'month' },
                    { name: 'All Time', value: 'all' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        const staffMember = interaction.options.getUser('staff');
        const period = interaction.options.getString('period') || 'week';

        let startDate = new Date();
        switch(period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'all':
                startDate = new Date(0);
                break;
        }
        const where = {
            guildId: interaction.guild.id,
            createdAt: { [require('sequelize').Op.gte]: startDate }
        };

        if (staffMember) {
            where.moderatorId = staffMember.id;
        }

        const actions = await Log.findAll({
            where: where,
            attributes: [
                'moderatorId',
                'moderatorName',
                'type',
                [require('sequelize').fn('COUNT', '*'), 'count']
            ],
            group: ['moderatorId', 'moderatorName', 'type']
        });

        const staffStats = {};
        actions.forEach(action => {
            if (!action.moderatorId) return;

            if (!staffStats[action.moderatorId]) {
                staffStats[action.moderatorId] = {
                    name: action.moderatorName,
                    total: 0,
                    actions: {}
                };
            }

            staffStats[action.moderatorId].actions[action.type] = parseInt(action.dataValues.count);
            staffStats[action.moderatorId].total += parseInt(action.dataValues.count);
        });
        const sortedStaff = Object.entries(staffStats)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10);

        if (sortedStaff.length === 0) {
            return interaction.editReply('No staff activity found for the selected period.');
        }

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`📊 Staff Statistics - ${period.charAt(0).toUpperCase() + period.slice(1)}`)
            .setDescription(staffMember ? `Activity for ${staffMember.tag}` : 'Top 10 most active staff members')
            .setFooter({ text: getServerName() })
            .setTimestamp();

        sortedStaff.forEach(([id, stats], index) => {
            const actionBreakdown = Object.entries(stats.actions)
                .map(([type, count]) => `${type}: ${count}`)
                .join('\n');

            embed.addFields({
                name: `${index + 1}. ${stats.name}`,
                value: `**Total Actions:** ${stats.total}\n${actionBreakdown}`,
                inline: true
            });
        });

        await interaction.editReply({ embeds: [embed] });
    }
};