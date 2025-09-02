const { Events, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

let confessionCount = 0;
const confessionAuthors = new Map();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId !== 'confession_modal') return;

        const confessionText = interaction.fields.getTextInputValue('confession_text');

        confessionCount++;

        confessionAuthors.set(confessionCount, {
            id: interaction.user.id,
            tag: interaction.user.tag,
            timestamp: Date.now()
        });

        const confessionChannelId = config.channels?.confessions || interaction.channel.id;
        const confessionChannel = interaction.guild.channels.cache.get(confessionChannelId);

        if (!confessionChannel) {
            return interaction.reply({
                content: '❌ Confession channel not found! Please contact an admin.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`🤫 Confession #${confessionCount}`)
            .setDescription(confessionText)
            .setFooter({ text: `${getServerName()} • Anonymous Confession` })
            .setTimestamp();

        await confessionChannel.send({ embeds: [embed] });

        await interaction.reply({
            content: `✅ Your confession has been posted anonymously as **Confession #${confessionCount}**`,
            ephemeral: true
        });

        console.log(`Confession #${confessionCount} submitted by ${interaction.user.tag}`);
    }
};