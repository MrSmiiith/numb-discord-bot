const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Interactive help menu with all commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Get detailed help for a specific command')
                .setRequired(false)),

    async execute(interaction) {
        const specificCommand = interaction.options.getString('command');

        if (specificCommand) {
            return this.showCommandHelp(interaction, specificCommand);
        }

        const mainEmbed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`📚 ${getServerName()} - Help Menu`)
            .setDescription(`
                **Welcome to ${getServerName()} Bot!**

                I'm a comprehensive community management bot with ${interaction.client.commands.size} commands across multiple categories.

                **Quick Stats:**
                • 🛡️ **Moderation:** Advanced warning & punishment system
                • 🎫 **Tickets:** Professional support system
                • ✅ **Verification:** Voice-based verification
                • 📊 **Analytics:** Member tracking & risk assessment
                • 🎯 **Automation:** Auto-reactions, auto-unmute, auto-close

                **Select a category below to view commands:**
            `)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '📖 Navigation', value: 'Use the dropdown menu below to browse command categories', inline: false },
                { name: '💡 Pro Tip', value: 'Use `/help <command>` to get detailed info about a specific command', inline: false }
            )
            .setFooter({ text: `${getServerName()} • Version 2.0.0 • ${interaction.client.commands.size} Commands` })
            .setTimestamp();
        const categoryMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('📂 Select a command category')
            .addOptions([
                {
                    label: 'Moderation',
                    description: 'Warning, muting, banning, and punishment commands',
                    value: 'moderation',
                    emoji: '⚔️'
                },
                {
                    label: 'Staff Tools',
                    description: 'Advanced tools for staff members',
                    value: 'staff',
                    emoji: '🛠️'
                },
                {
                    label: 'Information',
                    description: 'User info, server stats, and logging commands',
                    value: 'information',
                    emoji: '📊'
                },
                {
                    label: 'Tickets',
                    description: 'Support ticket system commands',
                    value: 'tickets',
                    emoji: '🎫'
                },
                {
                    label: 'Verification',
                    description: 'Member verification commands',
                    value: 'verification',
                    emoji: '✅'
                },
                {
                    label: 'Auto-Features',
                    description: 'Automation and reaction commands',
                    value: 'automation',
                    emoji: '🎯'
                },
                {
                    label: 'Utility',
                    description: 'General utility and backup commands',
                    value: 'utility',
                    emoji: '🔧'
                },
                {
                    label: 'Giveaways',
                    description: 'Giveaway management system',
                    value: 'giveaways',
                    emoji: '🎉'
                },
                {
                    label: 'Fun & Games',
                    description: 'Entertainment and game commands',
                    value: 'fun',
                    emoji: '🎮'
                },
                {
                    label: 'All Commands',
                    description: 'View all commands in a single list',
                    value: 'all',
                    emoji: '📋'
                }
            ]);
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`)
                    .setEmoji('🤖'),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/your-support-server')
                    .setEmoji('💬'),
                new ButtonBuilder()
                    .setLabel('GitHub')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/MrSmiiith/numb-discord-bot')
                    .setEmoji('📂'),
                new ButtonBuilder()
                    .setCustomId('help_home')
                    .setLabel('Home')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🏠')
            );

        const selectRow = new ActionRowBuilder().addComponents(categoryMenu);

        const message = await interaction.reply({
            embeds: [mainEmbed],
            components: [selectRow, buttons],
            ephemeral: true
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 300000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'This menu is not for you!', ephemeral: true });
            }

            const category = i.values[0];

            if (category === 'help_home') {
                await i.update({ embeds: [mainEmbed], components: [selectRow, buttons] });
            } else {
                const categoryEmbed = this.getCategoryEmbed(category);
                await i.update({ embeds: [categoryEmbed], components: [selectRow, buttons] });
            }
        });

        collector.on('end', () => {
            categoryMenu.setDisabled(true);
            interaction.editReply({ components: [selectRow, buttons] }).catch(() => {});
        });
    },
    getCategoryEmbed(category) {
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setFooter({ text: `${getServerName()} • Use /help <command> for detailed info` })
            .setTimestamp();

        switch(category) {
            case 'moderation':
                embed.setTitle('⚔️ Moderation Commands')
                    .setDescription('Commands for managing and moderating users')
                    .addFields(
                        { name: '⚠️ Warning System', value:
                            '`/warn` - Warn a user with optional DM\n' +
                            '`/warnings` - View warning history\n' +
                            '`/clearwarns` - Clear user warnings',
                            inline: false
                        },
                        { name: '🔇 Mute System', value:
                            '`/mute` - Permanently mute a user\n' +
                            '`/unmute` - Remove mute from user\n' +
                            '`/tempmute` - Temporary mute with auto-unmute',
                            inline: false
                        },
                        { name: '🔨 Punishments', value:
                            '`/ban` - Ban user from server\n' +
                            '`/unban` - Unban user by ID\n' +
                            '`/kick` - Remove user from server\n' +
                            '`/timeout` - Timeout user temporarily',
                            inline: false
                        }
                    );
                break;

            case 'staff':
                embed.setTitle('🛠️ Staff Tools')
                    .setDescription('Advanced moderation and management tools')
                    .addFields(
                        { name: '🧹 Channel Management', value:
                            '`/purge` - Bulk delete messages with filters\n' +
                            '`/slowmode` - Set channel slowmode\n' +
                            '`/lockdown` - Emergency channel lock\n' +
                            '`/nuke` - Delete and recreate channel',
                            inline: false
                        },
                        { name: '📢 Communication', value:
                            '`/announce` - Send formatted announcements\n' +
                            '`/role` - Add/remove/info about roles',
                            inline: false
                        }
                    );
                break;
            case 'information':
                embed.setTitle('📊 Information Commands')
                    .setDescription('View detailed information and statistics')
                    .addFields(
                        { name: '👤 User Information', value:
                            '`/userinfo` - Detailed user profile\n' +
                            '`/joininfo` - Member join details & risk\n' +
                            '`/modlogs` - User moderation history',
                            inline: false
                        },
                        { name: '📈 Statistics', value:
                            '`/serverinfo` - Server statistics\n' +
                            '`/staffstats` - Staff activity metrics\n' +
                            '`/invites` - Invite tracking & leaderboard\n' +
                            '`/stats` - Bot performance stats',
                            inline: false
                        }
                    );
                break;

            case 'tickets':
                embed.setTitle('🎫 Ticket System')
                    .setDescription('Professional support ticket management')
                    .addFields(
                        { name: '🎯 Ticket Management', value:
                            '`/ticket setup` - Create ticket panel\n' +
                            '`/ticket close` - Close current ticket\n' +
                            '`/ticket claim` - Claim ticket ownership\n' +
                            '`/ticket transcript` - Save conversation',
                            inline: false
                        },
                        { name: '👥 User Management', value:
                            '`/ticket add` - Add user to ticket\n' +
                            '`/ticket remove` - Remove user from ticket\n' +
                            '`/ticket stats` - View ticket statistics',
                            inline: false
                        },
                        { name: '📝 Categories', value:
                            '• Technical Problems\n' +
                            '• Staff Applications\n' +
                            '• Organization/Partnerships\n' +
                            '• General Support',
                            inline: false
                        }
                    );
                break;
            case 'verification':
                embed.setTitle('✅ Verification System')
                    .setDescription('Voice-based member verification')
                    .addFields(
                        { name: '🔊 Voice Verification', value:
                            '• 4 verification voice channels\n' +
                            '• Automatic staff alerts\n' +
                            '• Interactive dashboard\n' +
                            '• Gender role assignment',
                            inline: false
                        },
                        { name: '⚙️ Commands', value:
                            '`/verify` - Manually verify a user\n' +
                            '`/setup dashboard` - Configure dashboard\n' +
                            '`/setup check` - Verify configuration',
                            inline: false
                        }
                    );
                break;

            case 'automation':
                embed.setTitle('🎯 Automation Features')
                    .setDescription('Automatic features and reactions')
                    .addFields(
                        { name: '🔄 Auto-Reactions', value:
                            '`/autoreact add` - Add channel reactions\n' +
                            '`/autoreact remove` - Remove reactions\n' +
                            '`/autoreact list` - View all configurations\n' +
                            '`/autoreact toggle` - Enable/disable globally',
                            inline: false
                        },
                        { name: '⚡ Automatic Features', value:
                            '• Auto-unmute after temp mute expires\n' +
                            '• Auto-close tickets after 24h inactivity\n' +
                            '• Auto-assign unverified role\n' +
                            '• Auto risk assessment for new members\n' +
                            '• Auto invite tracking',
                            inline: false
                        }
                    );
                break;
            case 'utility':
                embed.setTitle('🔧 Utility Commands')
                    .setDescription('General utilities and management')
                    .addFields(
                        { name: '💾 Backup System', value:
                            '`/backup create` - Save server configuration\n' +
                            '`/backup list` - View available backups',
                            inline: false
                        },
                        { name: '📚 Help & Info', value:
                            '`/help` - This help menu\n' +
                            '`/help <command>` - Detailed command help',
                            inline: false
                        }
                    );
                break;

            case 'all':
                embed.setTitle('📋 All Commands')
                    .setDescription('Complete command list')
                    .addFields(
                        { name: '⚔️ Moderation (11)', value:
                            '`warn`, `warnings`, `clearwarns`, `mute`, `unmute`, `tempmute`, `ban`, `unban`, `kick`, `timeout`, `modlogs`',
                            inline: false
                        },
                        { name: '🛠️ Staff Tools (7)', value:
                            '`purge`, `slowmode`, `lockdown`, `nuke`, `role`, `announce`, `staffstats`',
                            inline: false
                        },
                        { name: '📊 Information (5)', value:
                            '`userinfo`, `serverinfo`, `joininfo`, `invites`, `stats`',
                            inline: false
                        },
                        { name: '🎫 Tickets (7)', value:
                            '`ticket setup`, `ticket close`, `ticket claim`, `ticket add`, `ticket remove`, `ticket transcript`, `ticket stats`',
                            inline: false
                        },
                        { name: '✅ Verification (3)', value:
                            '`verify`, `setup dashboard`, `setup check`',
                            inline: false
                        },
                        { name: '🎯 Auto-Features (5)', value:
                            '`autoreact add`, `autoreact remove`, `autoreact list`, `autoreact toggle`, `reactionroles`',
                            inline: false
                        },
                        { name: '🎉 Giveaways (6)', value:
                            '`giveaway start`, `giveaway drop`, `giveaway end`, `giveaway reroll`, `giveaway list`, `giveaway cancel`',
                            inline: false
                        },
                        { name: '🎮 Fun & Games (9)', value:
                            '`fun fact`, `fun joke`, `fun quote`, `fun wouldyourather`, `fun truthordare`, `confess`, `analytics`',
                            inline: false
                        },
                        { name: '🔧 Utility (4)', value:
                            '`help`, `backup create`, `backup list`, `features`',
                            inline: false
                        }
                    );
                break;
        }

        return embed;
    },
    showCommandHelp(interaction, commandName) {
        const command = interaction.client.commands.get(commandName.toLowerCase());

        if (!command) {
            return interaction.reply({
                content: `❌ Command \`${commandName}\` not found. Use \`/help\` to see all commands.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`📖 Command: /${command.data.name}`)
            .setDescription(command.data.description)
            .setFooter({ text: getServerName() })
            .setTimestamp();

        const usageExamples = {
            'warn': '/warn @user Spamming in chat\n/warn @user Breaking rules dm:false',
            'tempmute': '/tempmute @user 30m Spam\n/tempmute @user 2h Inappropriate behavior',
            'purge': '/purge 50\n/purge 100 @user\n/purge 50 contains:discord.gg',
            'lockdown': '/lockdown start #general Cleaning spam\n/lockdown end #general',
            'ticket': '/ticket setup\n/ticket close Resolved issue',
            'autoreact': '/autoreact add #announcements "👍 ❤️ 📢"',
            'invites': '/invites list\n/invites user @member\n/invites top',
            'role': '/role add @user @Member\n/role remove @user @Member',
            'announce': '/announce #news "Update!" message:"New features!"'
        };

        if (command.data.options && command.data.options.length > 0) {
            const options = command.data.options
                .map(opt => {
                    const required = opt.required ? '**Required**' : '*Optional*';
                    return `• \`${opt.name}\` (${opt.type}) - ${opt.description} [${required}]`;
                })
                .join('\n');

            embed.addFields({ name: '⚙️ Parameters', value: options, inline: false });
        }

        if (usageExamples[commandName]) {
            embed.addFields({
                name: '💡 Usage Examples',
                value: '```\n' + usageExamples[commandName] + '\n```',
                inline: false
            });
        }

        const defaultPerms = command.data.default_member_permissions;
        if (defaultPerms) {
            embed.addFields({
                name: '🔒 Required Permission',
                value: this.getPermissionName(defaultPerms),
                inline: true
            });
        }

        if (command.cooldown) {
            embed.addFields({
                name: '⏱️ Cooldown',
                value: `${command.cooldown} seconds`,
                inline: true
            });
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
    getPermissionName(permission) {
        const perms = {
            '8': 'Administrator',
            '4': 'Ban Members',
            '2': 'Kick Members',
            '268435456': 'Manage Webhooks',
            '134217728': 'Manage Emojis',
            '32': 'Manage Server',
            '16': 'Manage Channels',
            '8192': 'Manage Messages',
            '268435456': 'Manage Roles',
            '8589934592': 'Moderate Members'
        };

        return perms[permission] || 'Moderate Members';
    }
};
            case 'giveaways':
                embed.setTitle('🎉 Giveaway System')
                    .setDescription('Complete giveaway management system')
                    .addFields(
                        { name: '🎁 Giveaway Management', value:
                            '`/giveaway start` - Start a new giveaway\n' +
                            '`/giveaway drop` - Drop giveaway (first to react)\n' +
                            '`/giveaway end` - End a giveaway early\n' +
                            '`/giveaway reroll` - Reroll winners\n' +
                            '`/giveaway list` - List active giveaways\n' +
                            '`/giveaway cancel` - Cancel a giveaway',
                            inline: false
                        },
                        { name: '⚙️ Features', value:
                            '• Timed auto-draw system\n' +
                            '• Multiple winners support\n' +
                            '• Role/message requirements\n' +
                            '• Booster multiplier (2x entries)\n' +
                            '• Drop giveaways\n' +
                            '• Reroll capability',
                            inline: false
                        },
                        { name: '💡 Usage Example', value:
                            '`/giveaway start prize:"Nitro" duration:"24h" winners:2`',
                            inline: false
                        }
                    );
                break;

            case 'fun':
                embed.setTitle('🎮 Fun & Games')
                    .setDescription('Entertainment commands for your server')
                    .addFields(
                        { name: '🎲 Fun Commands', value:
                            '`/fun fact` - Random interesting fact\n' +
                            '`/fun joke` - Random joke\n' +
                            '`/fun quote` - Inspirational quote\n' +
                            '`/fun wouldyourather` - Would You Rather game\n' +
                            '`/fun truthordare` - Truth or Dare game',
                            inline: false
                        },
                        { name: '🤫 Confession System', value:
                            '`/confess submit` - Submit anonymous confession\n' +
                            '`/confess setup` - Setup confession info\n' +
                            '`/confess reveal` - Reveal author (Admin only)',
                            inline: false
                        },
                        { name: '📊 Analytics', value:
                            '`/analytics overview` - 7-day overview\n' +
                            '`/analytics activity` - Activity heatmap\n' +
                            '`/analytics channels` - Channel statistics\n' +
                            '`/analytics members` - Member engagement\n' +
                            '`/analytics growth` - Growth tracking\n' +
                            '`/analytics raid` - Raid detection',
                            inline: false
                        }
                    );
                break;