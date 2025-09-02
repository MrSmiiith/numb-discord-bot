const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');
const { Ticket, TicketMessage, Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup ticket system with categories'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close the current ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for closing')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim the current ticket'))        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transcript')
                .setDescription('Save ticket transcript'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View ticket statistics'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            await this.setupTickets(interaction);
        } else if (subcommand === 'close') {
            await this.closeTicket(interaction);
        } else if (subcommand === 'claim') {
            await this.claimTicket(interaction);
        } else if (subcommand === 'add') {
            await this.addUser(interaction);
        } else if (subcommand === 'remove') {
            await this.removeUser(interaction);
        } else if (subcommand === 'transcript') {
            await this.saveTranscript(interaction);
        } else if (subcommand === 'stats') {
            await this.showStats(interaction);
        }
    },
    async setupTickets(interaction) {
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`🎫 ${getServerName()} - Support Tickets`)
            .setDescription(`
                **Welcome to our ticket system!**

                Please select the appropriate category for your request:

                🔧 **Technical Problem** - Report bugs, errors, or technical issues
                👥 **Staff Application** - Apply to become a staff member
                🏢 **Organization** - Partnership, events, or server organization
                ❓ **Other** - General questions or other requests

                *A private channel will be created for you once you select a category.*
            `)
            .setFooter({ text: 'Select a category below to create a ticket' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_create')
                    .setPlaceholder('🎫 Select Ticket Category')
                    .addOptions([
                        {
                            label: 'Technical Problem',
                            description: 'Report bugs, errors, or technical issues',
                            value: 'problem',
                            emoji: '🔧'
                        },
                        {
                            label: 'Staff Application',
                            description: 'Apply to become a staff member',
                            value: 'staff_apply',
                            emoji: '👥'
                        },                        {
                            label: 'Organization',
                            description: 'Partnership, events, or server organization',
                            value: 'organization',
                            emoji: '🏢'
                        },
                        {
                            label: 'Other',
                            description: 'General questions or other requests',
                            value: 'other',
                            emoji: '❓'
                        }
                    ])
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },

    async closeTicket(interaction) {
        const ticket = await Ticket.findOne({
            where: {
                channelId: interaction.channel.id,
                status: { [require('sequelize').Op.ne]: 'closed' }
            }
        });

        if (!ticket) {
            return interaction.reply({
                content: '❌ This is not a ticket channel!',
                ephemeral: true
            });
        }

        const reason = interaction.options.getString('reason') || 'No reason provided';

        await interaction.reply('📝 Saving transcript and closing ticket...');
        const messages = await TicketMessage.findAll({
            where: { ticketId: ticket.ticketId },
            order: [['createdAt', 'ASC']]
        });

        let transcript = `Ticket #${ticket.ticketId} - ${ticket.category}\n`;
        transcript += `Created by: ${ticket.userName} (${ticket.userId})\n`;
        transcript += `Closed by: ${interaction.user.tag} (${interaction.user.id})\n`;
        transcript += `Reason: ${reason}\n\n`;
        transcript += `--- Transcript ---\n\n`;

        for (const msg of messages) {
            const timestamp = new Date(msg.createdAt).toLocaleString();
            transcript += `[${timestamp}] ${msg.userName}: ${msg.content}\n`;
            if (msg.attachments && msg.attachments.length > 0) {
                transcript += `  Attachments: ${msg.attachments.join(', ')}\n`;
            }
        }

        const buffer = Buffer.from(transcript, 'utf-8');
        const attachment = {
            attachment: buffer,
            name: `ticket-${ticket.ticketId}-transcript.txt`
        };

        const logChannelId = config.channels?.logs?.general;
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('info'))
                    .setTitle('📋 Ticket Closed')
                    .addFields(
                        { name: 'Ticket ID', value: `#${ticket.ticketId}`, inline: true },
                        { name: 'Category', value: ticket.category, inline: true },
                        { name: 'User', value: `<@${ticket.userId}>`, inline: true },
                        { name: 'Closed by', value: interaction.user.tag, inline: true },
                        { name: 'Messages', value: ticket.messageCount.toString(), inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed], files: [attachment] });
            }
        }
        ticket.status = 'closed';
        ticket.closedBy = interaction.user.id;
        ticket.closedByName = interaction.user.tag;
        ticket.closedAt = new Date();
        await ticket.save();

        await Log.create({
            guildId: interaction.guild.id,
            type: 'TICKET_CLOSE',
            userId: ticket.userId,
            userName: ticket.userName,
            moderatorId: interaction.user.id,
            moderatorName: interaction.user.tag,
            channelId: interaction.channel.id,
            reason: reason,
            extra: { ticketId: ticket.ticketId, category: ticket.category }
        });

        const user = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
        if (user) {
            const ratingEmbed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle('Rate Your Support Experience')
                .setDescription('Your ticket has been closed. Please rate your experience:')
                .setFooter({ text: getServerName() });

            const ratingRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket_rate_${ticket.ticketId}_1`)
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`ticket_rate_${ticket.ticketId}_2`)
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`ticket_rate_${ticket.ticketId}_3`)
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`ticket_rate_${ticket.ticketId}_4`)
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`ticket_rate_${ticket.ticketId}_5`)
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Secondary)
                );

            try {
                await user.send({ embeds: [ratingEmbed], components: [ratingRow] });
            } catch (error) {
                console.log('Could not send rating prompt to user');
            }
        }
        setTimeout(() => {
            interaction.channel.delete().catch(console.error);
        }, 5000);
    },

    async claimTicket(interaction) {
        const ticket = await Ticket.findOne({
            where: {
                channelId: interaction.channel.id,
                status: 'open'
            }
        });

        if (!ticket) {
            return interaction.reply({
                content: '❌ This is not an open ticket channel!',
                ephemeral: true
            });
        }

        if (ticket.claimedBy) {
            return interaction.reply({
                content: `❌ This ticket is already claimed by <@${ticket.claimedBy}>!`,
                ephemeral: true
            });
        }

        ticket.claimedBy = interaction.user.id;
        ticket.claimedByName = interaction.user.tag;
        ticket.status = 'claimed';
        await ticket.save();
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('success'))
            .setTitle('✅ Ticket Claimed')
            .setDescription(`This ticket has been claimed by ${interaction.user}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        await interaction.channel.setName(`claimed-${ticket.ticketId}`);
    },

    async addUser(interaction) {
        const ticket = await Ticket.findOne({
            where: { channelId: interaction.channel.id }
        });

        if (!ticket) {
            return interaction.reply({
                content: '❌ This is not a ticket channel!',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');

        await interaction.channel.permissionOverwrites.create(user, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true
        });

        await interaction.reply(`✅ Added ${user} to the ticket.`);
    },
    async removeUser(interaction) {
        const ticket = await Ticket.findOne({
            where: { channelId: interaction.channel.id }
        });

        if (!ticket) {
            return interaction.reply({
                content: '❌ This is not a ticket channel!',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');

        if (user.id === ticket.userId) {
            return interaction.reply({
                content: '❌ Cannot remove the ticket creator!',
                ephemeral: true
            });
        }

        await interaction.channel.permissionOverwrites.delete(user);
        await interaction.reply(`✅ Removed ${user} from the ticket.`);
    },

    async saveTranscript(interaction) {
        const ticket = await Ticket.findOne({
            where: { channelId: interaction.channel.id }
        });

        if (!ticket) {
            return interaction.reply({
                content: '❌ This is not a ticket channel!',
                ephemeral: true
            });
        }
        await interaction.deferReply();

        const messages = await TicketMessage.findAll({
            where: { ticketId: ticket.ticketId },
            order: [['createdAt', 'ASC']]
        });

        let transcript = `Ticket #${ticket.ticketId} - ${ticket.category}\n`;
        transcript += `Created by: ${ticket.userName} (${ticket.userId})\n`;
        transcript += `Status: ${ticket.status}\n\n`;
        transcript += `--- Transcript ---\n\n`;

        for (const msg of messages) {
            const timestamp = new Date(msg.createdAt).toLocaleString();
            transcript += `[${timestamp}] ${msg.userName}: ${msg.content}\n`;
        }

        const buffer = Buffer.from(transcript, 'utf-8');

        await interaction.editReply({
            content: '📄 Ticket transcript:',
            files: [{
                attachment: buffer,
                name: `ticket-${ticket.ticketId}-transcript.txt`
            }]
        });
    },

    async showStats(interaction) {
        const totalTickets = await Ticket.count({
            where: { guildId: interaction.guild.id }
        });

        const openTickets = await Ticket.count({
            where: { guildId: interaction.guild.id, status: 'open' }
        });

        const claimedTickets = await Ticket.count({
            where: { guildId: interaction.guild.id, status: 'claimed' }
        });
        const closedTickets = await Ticket.count({
            where: { guildId: interaction.guild.id, status: 'closed' }
        });

        const categoryStats = await Ticket.findAll({
            attributes: [
                'category',
                [require('sequelize').fn('COUNT', '*'), 'count']
            ],
            where: { guildId: interaction.guild.id },
            group: ['category']
        });

        const ratings = await Ticket.findAll({
            attributes: [
                [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avgRating']
            ],
            where: {
                guildId: interaction.guild.id,
                rating: { [require('sequelize').Op.ne]: null }
            }
        });

        const avgRating = ratings[0]?.dataValues?.avgRating || 0;

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('📊 Ticket Statistics')
            .addFields(
                { name: '📈 Total Tickets', value: totalTickets.toString(), inline: true },
                { name: '🟢 Open', value: openTickets.toString(), inline: true },
                { name: '🟡 Claimed', value: claimedTickets.toString(), inline: true },
                { name: '🔴 Closed', value: closedTickets.toString(), inline: true },
                { name: '⭐ Average Rating', value: avgRating ? `${avgRating.toFixed(1)}/5` : 'N/A', inline: true }
            )
            .setFooter({ text: getServerName() })
            .setTimestamp();

        if (categoryStats.length > 0) {
            const categoryText = categoryStats
                .map(c => `**${c.category}**: ${c.dataValues.count}`)
                .join('\n');
            embed.addFields({ name: '📂 By Category', value: categoryText, inline: false });
        }

        await interaction.reply({ embeds: [embed] });
    }
};