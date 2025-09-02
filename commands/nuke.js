const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Delete and recreate a channel (keeps settings)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to nuke (current if not specified)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for nuking')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        await interaction.reply({
            content: `⚠️ **WARNING**: This will delete and recreate ${channel}, removing ALL messages!\n\nReact with ✅ within 10 seconds to confirm.`,
            ephemeral: false
        });

        const confirmMsg = await interaction.fetchReply();
        await confirmMsg.react('✅');

        const filter = (reaction, user) => {
            return reaction.emoji.name === '✅' && user.id === interaction.user.id;
        };

        try {
            const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 10000, errors: ['time'] });

            if (collected.size === 0) return;
            const channelData = {
                name: channel.name,
                type: channel.type,
                topic: channel.topic,
                nsfw: channel.nsfw,
                bitrate: channel.bitrate,
                userLimit: channel.userLimit,
                rateLimitPerUser: channel.rateLimitPerUser,
                position: channel.position,
                parent: channel.parent,
                permissionOverwrites: channel.permissionOverwrites.cache.map(overwrite => ({
                    id: overwrite.id,
                    allow: overwrite.allow.toArray(),
                    deny: overwrite.deny.toArray()
                }))
            };

            await channel.delete(`Nuked by ${interaction.user.tag}: ${reason}`);

            const newChannel = await interaction.guild.channels.create({
                name: channelData.name,
                type: channelData.type,
                topic: channelData.topic,
                nsfw: channelData.nsfw,
                bitrate: channelData.bitrate,
                userLimit: channelData.userLimit,
                rateLimitPerUser: channelData.rateLimitPerUser,
                parent: channelData.parent,
                permissionOverwrites: channelData.permissionOverwrites,
                reason: `Nuked by ${interaction.user.tag}: ${reason}`
            });

            await newChannel.setPosition(channelData.position);

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('success'))
                .setTitle('💥 Channel Nuked')
                .setDescription('This channel has been nuked and recreated!')
                .addFields(
                    { name: 'Nuked by', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason, inline: true }
                )
                .setFooter({ text: getServerName() })
                .setTimestamp();

            await newChannel.send({ embeds: [embed] });

        } catch (error) {
            if (error.message === 'time') {
                await interaction.editReply('❌ Nuke cancelled - no confirmation received.');
            } else {
                console.error(error);
                await interaction.editReply('❌ Failed to nuke channel!');
            }
        }
    }
};