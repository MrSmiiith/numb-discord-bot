const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('contains')
                .setDescription('Only delete messages containing this text')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('bots')
                .setDescription('Only delete bot messages')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const contains = interaction.options.getString('contains');
        const botsOnly = interaction.options.getBoolean('bots');

        let messages = await interaction.channel.messages.fetch({ limit: 100 });

        if (targetUser) {
            messages = messages.filter(m => m.author.id === targetUser.id);
        }
        if (contains) {
            messages = messages.filter(m => m.content.toLowerCase().includes(contains.toLowerCase()));
        }
        if (botsOnly) {
            messages = messages.filter(m => m.author.bot);
        }
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

        const toDelete = Array.from(messages.values()).slice(0, amount);

        if (toDelete.length === 0) {
            return interaction.editReply('❌ No messages found matching the criteria.');
        }

        try {
            await interaction.channel.bulkDelete(toDelete, true);

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('success'))
                .setTitle('🗑️ Messages Purged')
                .setDescription(`Successfully deleted ${toDelete.length} message(s)`)
                .addFields(
                    { name: 'Channel', value: `${interaction.channel}`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Messages Deleted', value: toDelete.length.toString(), inline: true }
                )
                .setFooter({ text: getServerName() })
                .setTimestamp();

            if (targetUser) embed.addFields({ name: 'Target User', value: targetUser.tag, inline: true });
            if (contains) embed.addFields({ name: 'Filter', value: `Contains: "${contains}"`, inline: true });
            if (botsOnly) embed.addFields({ name: 'Filter', value: 'Bot messages only', inline: true });

            await interaction.editReply({ embeds: [embed] });

            const confirmMsg = await interaction.channel.send(`✅ Purged ${toDelete.length} messages`);
            setTimeout(() => confirmMsg.delete().catch(() => {}), 5000);

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Failed to delete messages. Some messages may be too old.');
        }
    }
};