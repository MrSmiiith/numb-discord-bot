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
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.tag,

                channels: guild.channels.cache.map(channel => ({
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parent: channel.parent?.name,
                    topic: channel.topic,
                    nsfw: channel.nsfw,
                    rateLimitPerUser: channel.rateLimitPerUser
                })),
                roles: guild.roles.cache
                    .filter(role => !role.managed && role.id !== guild.id)
                    .map(role => ({
                        name: role.name,
                        color: role.hexColor,
                        hoist: role.hoist,
                        position: role.position,
                        permissions: role.permissions.toArray(),
                        mentionable: role.mentionable
                    })),

                emojis: guild.emojis.cache.map(emoji => ({
                    name: emoji.name,
                    url: emoji.url
                })),

                settings: {
                    verificationLevel: guild.verificationLevel,
                    defaultMessageNotifications: guild.defaultMessageNotifications,
                    explicitContentFilter: guild.explicitContentFilter,
                    afkTimeout: guild.afkTimeout,
                    afkChannel: guild.afkChannel?.name,
                    systemChannel: guild.systemChannel?.name,
                    preferredLocale: guild.preferredLocale
                }
            };

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

            await interaction.editReply({ embeds: [embed] });                for (const backup of backups.slice(-10)) {
                    const filepath = path.join(backupDir, backup);
                    const data = JSON.parse(await fs.readFile(filepath, 'utf8'));
                    const date = new Date(data.createdAt);

                    embed.addFields({
                        name: backup,
                        value: `Created: ${date.toLocaleString()}\nBy: ${data.createdBy}`,
                        inline: true
                    });
                }

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                await interaction.reply({
                    content: '❌ No backups directory found.',
                    ephemeral: true
                });
            }
        }
    }
};