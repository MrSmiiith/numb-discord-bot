const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionroles')
        .setDescription('Setup reaction role panels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a reaction role panel')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Panel type from config')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Colors', value: 'colors' },
                            { name: 'Games', value: 'games' },
                            { name: 'Notifications', value: 'notifications' },
                            { name: 'Pronouns', value: 'pronouns' },
                            { name: 'Custom', value: 'custom' }
                        ))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send panel (default: current)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('button')
                .setDescription('Create button role panel')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Panel title')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Panel description')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dropdown')
                .setDescription('Create dropdown role panel')
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Panel title')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Panel description')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('multiple')
                        .setDescription('Allow multiple selections')))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch(subcommand) {
            case 'create':
                await this.createFromConfig(interaction);
                break;
            case 'button':
                await this.createButtonPanel(interaction);
                break;
            case 'dropdown':
                await this.createDropdownPanel(interaction);
                break;
        }
    },
    async createFromConfig(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const type = interaction.options.getString('type');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        const panelConfig = config.reactionRoles?.[type];

        if (!panelConfig) {
            return interaction.editReply(`❌ No configuration found for panel type: ${type}`);
        }

        const embed = new EmbedBuilder()
            .setColor(panelConfig.color || getEmbedColor('info'))
            .setTitle(panelConfig.title || '📋 Role Selection')
            .setDescription(panelConfig.description || 'Select your roles below')
            .setFooter({ text: panelConfig.footer || getServerName() })
            .setTimestamp();

        if (panelConfig.thumbnail) {
            embed.setThumbnail(panelConfig.thumbnail);
        }

        if (panelConfig.showList !== false) {
            for (const role of panelConfig.roles) {
                const roleObj = interaction.guild.roles.cache.get(role.id);
                if (roleObj) {
                    embed.addFields({
                        name: `${role.emoji} ${role.label}`,
                        value: role.description || roleObj.name,
                        inline: true
                    });
                }
            }
        }

        let components = [];

        if (panelConfig.style === 'buttons') {
            components = this.createButtonComponents(panelConfig.roles, type);
        } else if (panelConfig.style === 'dropdown') {
            components = this.createDropdownComponents(panelConfig.roles, type, panelConfig.multiple);
        } else {
            components = this.createButtonComponents(panelConfig.roles, type);
        }

        await channel.send({ embeds: [embed], components });
        await interaction.editReply(`✅ Reaction role panel created in ${channel}!`);
    },

    createButtonComponents(roles, panelType) {
        const components = [];
        let currentRow = new ActionRowBuilder();

        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];

            const button = new ButtonBuilder()
                .setCustomId(`role_${panelType}_${role.id}`)
                .setLabel(role.label)
                .setEmoji(role.emoji)
                .setStyle(role.style === 'danger' ? ButtonStyle.Danger :
                          role.style === 'success' ? ButtonStyle.Success :
                          role.style === 'primary' ? ButtonStyle.Primary :
                          ButtonStyle.Secondary);

            currentRow.addComponents(button);

            if ((i + 1) % 5 === 0 || i === roles.length - 1) {
                components.push(currentRow);
                if (i < roles.length - 1) {
                    currentRow = new ActionRowBuilder();
                }
            }
        }

        return components;
    },
    createDropdownComponents(roles, panelType, multiple = false) {
        const options = roles.map(role => ({
            label: role.label,
            value: `${role.id}`,
            description: role.description || 'Select to get this role',
            emoji: role.emoji
        }));

        const dropdown = new StringSelectMenuBuilder()
            .setCustomId(`roleselect_${panelType}`)
            .setPlaceholder('Select your roles')
            .setMinValues(multiple ? 0 : 1)
            .setMaxValues(multiple ? options.length : 1)
            .addOptions(options);

        return [new ActionRowBuilder().addComponents(dropdown)];
    },

    async createButtonPanel(interaction) {
        await interaction.reply({
            content: 'Please use `/reactionroles create` with a predefined type, or configure custom panels in config.js',
            ephemeral: true
        });
    },

    async createDropdownPanel(interaction) {
        await interaction.reply({
            content: 'Please use `/reactionroles create` with a predefined type, or configure custom panels in config.js',
            ephemeral: true
        });
    }
};