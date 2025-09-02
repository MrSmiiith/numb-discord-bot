const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Lockdown, Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock or unlock a channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Lock down a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to lock (current channel if not specified)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for lockdown')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End lockdown for a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to unlock (current channel if not specified)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all active lockdowns'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            const channel = interaction.options.getChannel('channel') || interaction.channel;
            const reason = interaction.options.getString('reason') || 'No reason provided';

            const existingLock = await Lockdown.findOne({
                where: {
                    guildId: interaction.guild.id,
                    channelId: channel.id,
                    active: true
                }
            });

            if (existingLock) {
                return interaction.reply({
                    content: `❌ Channel ${channel} is already locked down!`,
                    ephemeral: true
                });
            }

            const everyoneRole = interaction.guild.roles.everyone;
            const currentPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);

            const previousPermissions = currentPerms ? {
                allow: currentPerms.allow.toArray(),
                deny: currentPerms.deny.toArray()
            } : null;
            try {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false,
                    SendMessagesInThreads: false,
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false,
                    AddReactions: false
                });

                await Lockdown.create({
                    guildId: interaction.guild.id,
                    channelId: channel.id,
                    channelName: channel.name,
                    initiatedBy: interaction.user.id,
                    initiatedByName: interaction.user.tag,
                    reason: reason,
                    previousPermissions: previousPermissions
                });

                await Log.create({
                    guildId: interaction.guild.id,
                    type: 'LOCKDOWN_START',
                    moderatorId: interaction.user.id,
                    moderatorName: interaction.user.tag,
                    channelId: channel.id,
                    channelName: channel.name,
                    reason: reason
                });
                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('error'))
                    .setTitle(`🔒 Channel Locked Down`)
                    .setDescription(`${channel} has been locked down!`)
                    .addFields(
                        { name: '📢 Channel', value: `${channel}`, inline: true },
                        { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                        { name: '📝 Reason', value: reason, inline: false }
                    )
                    .setFooter({ text: getServerName() })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

                const lockEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('error'))
                    .setTitle('🔒 This channel has been locked')
                    .setDescription('Only staff members can send messages in this channel.')
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Locked by', value: interaction.user.tag }
                    )
                    .setTimestamp();

                await channel.send({ embeds: [lockEmbed] });

            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ Failed to lock down the channel!',
                    ephemeral: true
                });
            }
        } else if (subcommand === 'end') {
            const channel = interaction.options.getChannel('channel') || interaction.channel;

            const lockdown = await Lockdown.findOne({
                where: {
                    guildId: interaction.guild.id,
                    channelId: channel.id,
                    active: true
                }
            });

            if (!lockdown) {
                return interaction.reply({
                    content: `❌ Channel ${channel} is not locked down!`,
                    ephemeral: true
                });
            }

            try {
                const everyoneRole = interaction.guild.roles.everyone;

                if (lockdown.previousPermissions) {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: null,
                        SendMessagesInThreads: null,
                        CreatePublicThreads: null,
                        CreatePrivateThreads: null,
                        AddReactions: null
                    });
                } else {
                    await channel.permissionOverwrites.delete(everyoneRole);
                }
                lockdown.active = false;
                await lockdown.save();

                await Log.create({
                    guildId: interaction.guild.id,
                    type: 'LOCKDOWN_END',
                    moderatorId: interaction.user.id,
                    moderatorName: interaction.user.tag,
                    channelId: channel.id,
                    channelName: channel.name
                });

                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('success'))
                    .setTitle(`🔓 Channel Unlocked`)
                    .setDescription(`${channel} lockdown has been lifted!`)
                    .addFields(
                        { name: '📢 Channel', value: `${channel}`, inline: true },
                        { name: '👮 Moderator', value: interaction.user.tag, inline: true },
                        { name: '⏱️ Duration', value: `${Math.round((Date.now() - lockdown.createdAt) / 60000)} minutes`, inline: true }
                    )
                    .setFooter({ text: getServerName() })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

                const unlockEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('success'))
                    .setTitle('🔓 Channel Unlocked')
                    .setDescription('This channel is now open for messages.')
                    .setTimestamp();

                await channel.send({ embeds: [unlockEmbed] });
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: '❌ Failed to unlock the channel!',
                    ephemeral: true
                });
            }

        } else if (subcommand === 'list') {
            const lockdowns = await Lockdown.findAll({
                where: {
                    guildId: interaction.guild.id,
                    active: true
                }
            });

            if (lockdowns.length === 0) {
                return interaction.reply({
                    content: '✅ No active lockdowns in this server.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle('🔒 Active Lockdowns')
                .setDescription(`There are ${lockdowns.length} active lockdowns:`)
                .setFooter({ text: getServerName() })
                .setTimestamp();

            for (const lock of lockdowns) {
                const duration = Math.round((Date.now() - lock.createdAt) / 60000);
                embed.addFields({
                    name: `#${lock.channelName}`,
                    value: `**Locked by:** ${lock.initiatedByName}\n**Duration:** ${duration} minutes\n**Reason:** ${lock.reason}`,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });
        }
    }
};