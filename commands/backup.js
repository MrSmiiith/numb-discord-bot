const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Backup server settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a backup of server settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List available backups'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;
            const backup = {
                name: guild.name,
                id: guild.id,
                icon: guild.iconURL(),
                banner: guild.bannerURL(),
                description: guild.description,
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.tag,
                channels: guild.channels.cache.map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parentId: channel.parentId,
                    topic: channel.topic || null,
                    nsfw: channel.nsfw || false,
                    rateLimitPerUser: channel.rateLimitPerUser || 0
                })),
                roles: guild.roles.cache.map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    permissions: role.permissions.bitfield.toString(),
                    position: role.position
                })),
                settings: {
                    verificationLevel: guild.verificationLevel,
                    defaultMessageNotifications: guild.defaultMessageNotifications,
                    explicitContentFilter: guild.explicitContentFilter,
                    afkChannelId: guild.afkChannelId,
                    afkTimeout: guild.afkTimeout,
                    systemChannelId: guild.systemChannelId,
                    premiumTier: guild.premiumTier,
                    premiumSubscriptionCount: guild.premiumSubscriptionCount,
                    preferredLocale: guild.preferredLocale
                }
            };

            try {
                const backupDir = path.join(__dirname, '..', 'backups');
                await fs.mkdir(backupDir, { recursive: true });

                const filename = `backup-${guild.id}-${Date.now()}.json`;
                const filepath = path.join(backupDir, filename);

                await fs.writeFile(filepath, JSON.stringify(backup, null, 2));

                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('success'))
                    .setTitle('✅ Backup Created')
                    .setDescription('Server backup has been created successfully!')
                    .addFields(
                        { name: 'Filename', value: filename, inline: true },
                        { name: 'Channels', value: backup.channels.length.toString(), inline: true },
                        { name: 'Roles', value: backup.roles.length.toString(), inline: true }
                    )
                    .setFooter({ text: getServerName() })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Backup creation error:', error);
                await interaction.editReply({
                    content: '❌ Failed to create backup. Please try again.',
                    ephemeral: true
                });
            }

        } else if (subcommand === 'list') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const backupDir = path.join(__dirname, '..', 'backups');
                const backups = await fs.readdir(backupDir);
                
                if (backups.length === 0) {
                    return await interaction.editReply({
                        content: '📁 No backups found. Create one with `/backup create`',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor(getEmbedColor('info'))
                    .setTitle('📁 Available Backups')
                    .setDescription('Here are your server backups:')
                    .setFooter({ text: getServerName() })
                    .setTimestamp();

                for (const backup of backups.slice(-10)) {
                    const filepath = path.join(backupDir, backup);
                    const data = JSON.parse(await fs.readFile(filepath, 'utf8'));
                    const date = new Date(data.createdAt);

                    embed.addFields({
                        name: backup,
                        value: `Created: ${date.toLocaleString()}\nBy: ${data.createdBy}`,
                        inline: true
                    });
                }

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('Backup list error:', error);
                await interaction.editReply({
                    content: '❌ No backups directory found.',
                    ephemeral: true
                });
            }
        }
    }
};