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
            return await this.showCommandHelp(interaction, specificCommand);
        }

        const mainEmbed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`📚 ${getServerName()} - Help Menu`)
            .setDescription(`
                **Welcome to ${getServerName()} Bot!**

                I'm your comprehensive server management bot with **${interaction.client.commands.size} commands** across multiple categories.

                **🎯 Key Features:**
                • **Advanced Moderation** - Warning system, mutes, bans, timeouts
                • **Ticket System** - Professional support ticket management  
                • **Voice Verification** - Secure member verification process
                • **Analytics** - Member tracking & security risk assessment
                • **Automation** - Auto-reactions, auto-unmute, scheduled tasks
                • **Staff Tools** - Channel management, announcements, logs

                **📝 Select a category below to explore commands:**
            `)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '🔍 Quick Search', value: 'Use `/help <command>` for detailed command information', inline: true },
                { name: '⏱️ Session Info', value: 'This help menu stays active for 5 minutes', inline: true },
                { name: '📊 Bot Stats', value: `**${interaction.client.commands.size}** commands available`, inline: true }
            )
            .setFooter({ text: `${getServerName()} Bot • Professional Discord Management` })
            .setTimestamp();

        const categoryMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('📂 Select a command category')
            .addOptions([
                {
                    label: 'Moderation',
                    description: 'Warns, mutes, bans, timeouts, and punishment tools',
                    value: 'moderation',
                    emoji: '⚔️'
                },
                {
                    label: 'Staff Tools',
                    description: 'Channel management, announcements, and staff utilities',
                    value: 'staff',
                    emoji: '🛠️'
                },
                {
                    label: 'Information',
                    description: 'User info, server stats, analytics, and logs',
                    value: 'information',
                    emoji: '📊'
                },
                {
                    label: 'Tickets',
                    description: 'Support ticket system management',
                    value: 'tickets',
                    emoji: '🎫'
                },
                {
                    label: 'Verification',
                    description: 'Voice verification and member approval',
                    value: 'verification',
                    emoji: '✅'
                },
                {
                    label: 'Automation',
                    description: 'Auto-reactions, reaction roles, and scheduled tasks',
                    value: 'automation',
                    emoji: '🤖'
                },
                {
                    label: 'Utility',
                    description: 'Setup, backups, and general utilities',
                    value: 'utility',
                    emoji: '🔧'
                },
                {
                    label: 'Giveaways',
                    description: 'Giveaway creation and management',
                    value: 'giveaways',
                    emoji: '🎉'
                },
                {
                    label: 'Fun & Games',
                    description: 'Entertainment, confessions, and interactive commands',
                    value: 'fun',
                    emoji: '🎮'
                },
                {
                    label: 'All Commands',
                    description: 'Complete list of all available commands',
                    value: 'all',
                    emoji: '📋'
                }
            ]);

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_home')
                    .setLabel('🏠 Home')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('help_refresh')
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_features')
                    .setLabel('⚡ Features')
                    .setStyle(ButtonStyle.Success)
            );

        const selectRow = new ActionRowBuilder().addComponents(categoryMenu);

        const message = await interaction.reply({
            embeds: [mainEmbed],
            components: [selectRow, buttons],
            flags: ['Ephemeral']
        });

        const collector = message.createMessageComponentCollector({
            time: 300000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ This help menu is not for you!', flags: ['Ephemeral'] });
            }

            if (i.isStringSelectMenu()) {
                const category = i.values[0];
                const categoryEmbed = this.getCategoryEmbed(category, interaction.client);
                await i.update({ embeds: [categoryEmbed], components: [selectRow, buttons] });
            } else if (i.isButton()) {
                switch (i.customId) {
                    case 'help_home':
                        await i.update({ embeds: [mainEmbed], components: [selectRow, buttons] });
                        break;
                    case 'help_refresh':
                        await i.update({ embeds: [mainEmbed], components: [selectRow, buttons] });
                        break;
                    case 'help_features':
                        const featuresEmbed = this.getFeaturesEmbed();
                        await i.update({ embeds: [featuresEmbed], components: [selectRow, buttons] });
                        break;
                }
            }
        });

        collector.on('end', () => {
            const disabledMenu = StringSelectMenuBuilder.from(categoryMenu).setDisabled(true);
            const disabledButtons = new ActionRowBuilder()
                .addComponents(
                    buttons.components.map(button => ButtonBuilder.from(button).setDisabled(true))
                );
            interaction.editReply({ 
                components: [
                    new ActionRowBuilder().addComponents(disabledMenu), 
                    disabledButtons
                ] 
            }).catch(() => {});
        });
    },

    async showCommandHelp(interaction, commandName) {
        const command = interaction.client.commands.get(commandName.toLowerCase());
        
        if (!command) {
            return interaction.reply({
                content: `❌ Command \`${commandName}\` not found. Use \`/help\` to see all available commands.`,
                flags: ['Ephemeral']
            });
        }

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`📖 Command Help: /${command.data.name}`)
            .setDescription(command.data.description || 'No description available')
            .addFields(
                { name: '📝 Usage', value: `\`/${command.data.name}\``, inline: true },
                { name: '🏷️ Category', value: this.getCommandCategory(command.data.name), inline: true }
            )
            .setFooter({ text: `${getServerName()} • Use /help to return to main menu` })
            .setTimestamp();

        // Add options if they exist
        if (command.data.options && command.data.options.length > 0) {
            const options = command.data.options.map(opt => {
                const required = opt.required ? '**[Required]**' : '[Optional]';
                return `${required} \`${opt.name}\` - ${opt.description}`;
            }).join('\n');
            
            embed.addFields({ name: '⚙️ Options', value: options, inline: false });
        }

        return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
    },

    getCategoryEmbed(category, client) {
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setFooter({ text: `${getServerName()} • Use /help <command> for detailed info` })
            .setTimestamp();

        switch(category) {
            case 'moderation':
                embed.setTitle('⚔️ Moderation Commands')
                    .setDescription('**Advanced moderation tools for maintaining server order**')
                    .addFields(
                        { 
                            name: '⚠️ Warning System', 
                            value: '`/warn` - Issue warnings to users with optional DM\n' +
                                   '`/warnings` - View complete warning history\n' +
                                   '`/clearwarns` - Clear all warnings for a user',
                            inline: false
                        },
                        { 
                            name: '🔇 Mute Management', 
                            value: '`/mute` - Permanently mute a disruptive user\n' +
                                   '`/unmute` - Remove mute from a user\n' +
                                   '`/tempmute` - Temporary mute with auto-unmute timer',
                            inline: false
                        },
                        { 
                            name: '🔨 Punishment Tools', 
                            value: '`/ban` - Permanently ban user from server\n' +
                                   '`/unban` - Unban user by their Discord ID\n' +
                                   '`/kick` - Remove user from server\n' +
                                   '`/timeout` - Discord timeout (temporary restriction)',
                            inline: false
                        }
                    );
                break;

            case 'staff':
                embed.setTitle('🛠️ Staff Tools')
                    .setDescription('**Powerful tools for staff and moderators**')
                    .addFields(
                        { 
                            name: '🧹 Channel Management', 
                            value: '`/purge` - Bulk delete messages with advanced filters\n' +
                                   '`/slowmode` - Set channel message cooldown\n' +
                                   '`/lockdown` - Emergency channel lock (no talking)\n' +
                                   '`/nuke` - Delete and recreate channel instantly',
                            inline: false
                        },
                        { 
                            name: '📢 Communication', 
                            value: '`/announce` - Send professional announcements\n' +
                                   '`/role` - Advanced role management tools\n' +
                                   '`/modlogs` - Access detailed moderation logs',
                            inline: false
                        }
                    );
                break;

            case 'information':
                embed.setTitle('📊 Information Commands')
                    .setDescription('**Detailed information and analytics tools**')
                    .addFields(
                        { 
                            name: '👥 User Information', 
                            value: '`/userinfo` - Complete user profile and stats\n' +
                                   '`/joininfo` - User join details and history\n' +
                                   '`/analytics` - Advanced user risk assessment',
                            inline: false
                        },
                        { 
                            name: '🏰 Server Statistics', 
                            value: '`/serverinfo` - Complete server information\n' +
                                   '`/stats` - Server activity statistics\n' +
                                   '`/staffstats` - Staff activity tracking\n' +
                                   '`/invites` - Invite link analytics',
                            inline: false
                        }
                    );
                break;

            case 'tickets':
                embed.setTitle('🎫 Ticket System')
                    .setDescription('**Professional support ticket management**')
                    .addFields(
                        { 
                            name: '🎫 Ticket Operations', 
                            value: '`/ticket` - Create, manage, or close tickets\n' +
                                   '• **Create** - Start new support ticket\n' +
                                   '• **Close** - Close current ticket\n' +
                                   '• **Add/Remove** - Manage ticket participants\n' +
                                   '• **Transcript** - Generate ticket history',
                            inline: false
                        },
                        { 
                            name: '⚙️ Ticket Features', 
                            value: '• Auto-transcripts on close\n' +
                                   '• Staff-only access controls\n' +
                                   '• Category-based organization\n' +
                                   '• Professional ticket numbering',
                            inline: false
                        }
                    );
                break;

            case 'verification':
                embed.setTitle('✅ Verification System')
                    .setDescription('**Voice-based member verification process**')
                    .addFields(
                        { 
                            name: '🎤 Voice Verification', 
                            value: '`/verify` - Start voice verification process\n' +
                                   '• Join verification voice channel\n' +
                                   '• Staff approve/deny verification\n' +
                                   '• Auto-role assignment on approval\n' +
                                   '• Security risk assessment',
                            inline: false
                        },
                        { 
                            name: '🔒 Security Features', 
                            value: '• Account age verification\n' +
                                   '• Join date analysis\n' +
                                   '• Risk factor calculation\n' +
                                   '• Staff notification system',
                            inline: false
                        }
                    );
                break;

            case 'automation':
                embed.setTitle('🤖 Automation Commands')
                    .setDescription('**Automated features and reaction systems**')
                    .addFields(
                        { 
                            name: '⚡ Auto-Reactions', 
                            value: '`/autoreact` - Set up automatic message reactions\n' +
                                   '• Configure trigger words/phrases\n' +
                                   '• Custom emoji reactions\n' +
                                   '• Channel-specific rules',
                            inline: false
                        },
                        { 
                            name: '🎭 Reaction Roles', 
                            value: '`/reactionroles` - Role assignment via reactions\n' +
                                   '• Create reaction role messages\n' +
                                   '• Multiple role options\n' +
                                   '• Easy member self-assignment',
                            inline: false
                        }
                    );
                break;

            case 'utility':
                embed.setTitle('🔧 Utility Commands')
                    .setDescription('**Setup, maintenance, and utility tools**')
                    .addFields(
                        { 
                            name: '⚙️ Bot Configuration', 
                            value: '`/setup` - Initial bot setup and configuration\n' +
                                   '`/features` - View all available bot features\n' +
                                   '`/about` - Bot information and credits',
                            inline: false
                        },
                        { 
                            name: '💾 Backup System', 
                            value: '`/backup` - Server backup and restore tools\n' +
                                   '• Create server backups\n' +
                                   '• List available backups\n' +
                                   '• Restore from backup',
                            inline: false
                        }
                    );
                break;

            case 'giveaways':
                embed.setTitle('🎉 Giveaway System')
                    .setDescription('**Complete giveaway management system**')
                    .addFields(
                        { 
                            name: '🎁 Giveaway Management', 
                            value: '`/giveaway` - Full giveaway control system\n' +
                                   '• **Start** - Create new giveaways\n' +
                                   '• **End** - End giveaways early\n' +
                                   '• **Reroll** - Select new winners\n' +
                                   '• **List** - View active giveaways',
                            inline: false
                        },
                        { 
                            name: '🎯 Giveaway Features', 
                            value: '• Custom duration settings\n' +
                                   '• Multiple winner support\n' +
                                   '• Entry requirements\n' +
                                   '• Automatic winner selection',
                            inline: false
                        }
                    );
                break;

            case 'fun':
                embed.setTitle('🎮 Fun & Games')
                    .setDescription('**Entertainment and interactive features**')
                    .addFields(
                        { 
                            name: '🎪 Interactive Fun', 
                            value: '`/fun` - Mini-games and entertainment\n' +
                                   '`/confess` - Anonymous confession system\n' +
                                   '• Safe anonymous messaging\n' +
                                   '• Moderation controls\n' +
                                   '• Fun server interactions',
                            inline: false
                        }
                    );
                break;

            case 'all':
                // Get all commands organized
                const commands = client.commands;
                embed.setTitle('📋 All Commands')
                    .setDescription(`**Complete list of all ${commands.size} commands**\n\n` +
                        '*Use `/help <command>` for detailed information about any command*');

                // Group commands alphabetically for better readability
                const commandList = Array.from(commands.values())
                    .sort((a, b) => a.data.name.localeCompare(b.data.name))
                    .map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description || 'No description'}`)
                    .join('\n');

                // Split into chunks if too long
                if (commandList.length > 1024) {
                    const chunks = this.chunkString(commandList, 1024);
                    chunks.forEach((chunk, index) => {
                        embed.addFields({
                            name: index === 0 ? '📝 Available Commands' : '📝 More Commands',
                            value: chunk,
                            inline: false
                        });
                    });
                } else {
                    embed.addFields({
                        name: '📝 Available Commands',
                        value: commandList,
                        inline: false
                    });
                }
                break;

            default:
                embed.setTitle('❌ Category Not Found')
                    .setDescription('Please select a valid category from the dropdown menu.');
        }

        return embed;
    },

    getFeaturesEmbed() {
        return new EmbedBuilder()
            .setColor(getEmbedColor('success'))
            .setTitle('⚡ NUMB SYSTEM Features')
            .setDescription('**Comprehensive Discord server management solution**')
            .addFields(
                { 
                    name: '🛡️ Advanced Security', 
                    value: '• Voice verification system\n• Risk assessment analytics\n• Anti-raid protection\n• Automated threat detection',
                    inline: true
                },
                { 
                    name: '🎫 Professional Support', 
                    value: '• Ticket system with transcripts\n• Staff management tools\n• Auto-close scheduling\n• Category organization',
                    inline: true
                },
                { 
                    name: '📊 Smart Analytics', 
                    value: '• Member join tracking\n• Activity monitoring\n• Risk factor calculation\n• Detailed reporting',
                    inline: true
                },
                { 
                    name: '🤖 Automation', 
                    value: '• Auto-reactions\n• Reaction roles\n• Scheduled tasks\n• Auto-moderation',
                    inline: true
                },
                { 
                    name: '⚔️ Moderation Suite', 
                    value: '• Warning system\n• Mute management\n• Ban/kick tools\n• Message management',
                    inline: true
                },
                { 
                    name: '🎉 Engagement Tools', 
                    value: '• Giveaway system\n• Fun commands\n• Confession system\n• Interactive features',
                    inline: true
                }
            )
            .setFooter({ text: `${getServerName()} • Professional Discord Management` })
            .setTimestamp();
    },

    getCommandCategory(commandName) {
        const categories = {
            // Moderation
            'warn': 'Moderation', 'warnings': 'Moderation', 'clearwarns': 'Moderation',
            'mute': 'Moderation', 'unmute': 'Moderation', 'tempmute': 'Moderation',
            'ban': 'Moderation', 'unban': 'Moderation', 'kick': 'Moderation', 'timeout': 'Moderation',
            
            // Staff Tools
            'purge': 'Staff Tools', 'slowmode': 'Staff Tools', 'lockdown': 'Staff Tools', 'nuke': 'Staff Tools',
            'announce': 'Staff Tools', 'role': 'Staff Tools', 'modlogs': 'Staff Tools',
            
            // Information
            'userinfo': 'Information', 'joininfo': 'Information', 'analytics': 'Information',
            'serverinfo': 'Information', 'stats': 'Information', 'staffstats': 'Information', 'invites': 'Information',
            
            // Tickets
            'ticket': 'Tickets',
            
            // Verification
            'verify': 'Verification',
            
            // Automation
            'autoreact': 'Automation', 'reactionroles': 'Automation',
            
            // Utility
            'setup': 'Utility', 'features': 'Utility', 'about': 'Utility', 'backup': 'Utility', 'help': 'Utility',
            
            // Giveaways
            'giveaway': 'Giveaways',
            
            // Fun
            'fun': 'Fun & Games', 'confess': 'Fun & Games'
        };

        return categories[commandName] || 'Utility';
    },

    chunkString(str, size) {
        const chunks = [];
        const lines = str.split('\n');
        let currentChunk = '';

        for (const line of lines) {
            if ((currentChunk + line + '\n').length > size) {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = line + '\n';
            } else {
                currentChunk += line + '\n';
            }
        }

        if (currentChunk) chunks.push(currentChunk.trim());
        return chunks;
    }
};
