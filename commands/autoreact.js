const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoreact')
        .setDescription('Manage auto-reactions for channels (Admin only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add auto-reactions to a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to add auto-reactions to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reactions')
                        .setDescription('Reactions separated by spaces (e.g., "👍 ❤️ 🎉")')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('react_to_bots')
                        .setDescription('React to bot messages?')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('keywords')
                        .setDescription('Optional keywords to trigger reactions (comma-separated)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove auto-reactions from a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to remove auto-reactions from')
                        .setRequired(true)))        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all channels with auto-reactions'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable auto-reactions globally')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable auto-reactions?')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const configPath = path.join(__dirname, '..', 'config.js');

        delete require.cache[require.resolve(configPath)];
        const config = require(configPath);

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const channel = interaction.options.getChannel('channel');
            const reactions = interaction.options.getString('reactions').split(/\s+/).filter(r => r);
            const reactToBots = interaction.options.getBoolean('react_to_bots') ?? true;
            const keywordsString = interaction.options.getString('keywords');
            const keywords = keywordsString ? keywordsString.split(',').map(k => k.trim()) : undefined;
            const existingIndex = config.autoReactions.channels.findIndex(ch => ch.channelId === channel.id);

            const channelConfig = {
                channelId: channel.id,
                reactions: reactions,
                reactToBot: reactToBots,
                reactToUsers: true,
                ...(keywords && { keywords })
            };

            if (existingIndex !== -1) {
                config.autoReactions.channels[existingIndex] = channelConfig;
            } else {
                config.autoReactions.channels.push(channelConfig);
            }

            await this.saveConfig(config, configPath);

            interaction.client.config = config;

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('success'))
                .setTitle(`✅ Auto-Reactions Added`)
                .setDescription(`Auto-reactions have been configured for <#${channel.id}>`)
                .addFields(
                    { name: '📝 Reactions', value: reactions.join(' '), inline: true },
                    { name: '🤖 React to Bots', value: reactToBots ? 'Yes' : 'No', inline: true },
                    { name: '🔑 Keywords', value: keywords ? keywords.join(', ') : 'None', inline: false }
                )
                .setFooter({ text: getServerName() })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'remove') {
            const channel = interaction.options.getChannel('channel');

            const existingIndex = config.autoReactions.channels.findIndex(ch => ch.channelId === channel.id);

            if (existingIndex === -1) {
                return interaction.reply({
                    content: `❌ No auto-reactions found for <#${channel.id}>`,
                    ephemeral: true
                });
            }

            config.autoReactions.channels.splice(existingIndex, 1);

            await this.saveConfig(config, configPath);

            interaction.client.config = config;

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('success'))
                .setTitle(`✅ Auto-Reactions Removed`)
                .setDescription(`Auto-reactions have been removed from <#${channel.id}>`)
                .setFooter({ text: getServerName() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'list') {
            const channels = config.autoReactions.channels;

            if (channels.length === 0) {
                return interaction.reply({
                    content: '❌ No channels have auto-reactions configured.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle(`📋 Auto-Reaction Channels`)
                .setDescription(`**Status:** ${config.autoReactions.enabled ? '✅ Enabled' : '❌ Disabled'}\n\nChannels with auto-reactions:`)
                .setFooter({ text: getServerName() })
                .setTimestamp();

            for (const ch of channels) {
                const channel = interaction.guild.channels.cache.get(ch.channelId);
                const name = channel ? `<#${ch.channelId}>` : `Unknown Channel (${ch.channelId})`;
                const value = `**Reactions:** ${ch.reactions.join(' ')}\n**Bots:** ${ch.reactToBot ? 'Yes' : 'No'} | **Users:** ${ch.reactToUsers ? 'Yes' : 'No'}${ch.keywords ? `\n**Keywords:** ${ch.keywords.join(', ')}` : ''}`;

                embed.addFields({ name, value, inline: false });
            }

            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'toggle') {
            const enabled = interaction.options.getBoolean('enabled');

            config.autoReactions.enabled = enabled;
            config.features.autoReactions = enabled;

            await this.saveConfig(config, configPath);

            interaction.client.config = config;

            const embed = new EmbedBuilder()
                .setColor(getEmbedColor(enabled ? 'success' : 'warning'))
                .setTitle(enabled ? '✅ Auto-Reactions Enabled' : '❌ Auto-Reactions Disabled')
                .setDescription(`Auto-reactions have been ${enabled ? 'enabled' : 'disabled'} globally.`)
                .setFooter({ text: getServerName() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },

    async saveConfig(config, configPath) {
        const configContent = `module.exports = ${JSON.stringify(config, null, 4)};`;
        fs.writeFileSync(configPath, configContent, 'utf8');
    }
};