const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { Ticket, TicketMessage, Log } = require('../database/init');
const { getEmbedColor, getServerName } = require('../utils/branding');
const config = require('../config');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_create') {
            const category = interaction.values[0];
            const member = interaction.member;

            const existingTicket = await Ticket.findOne({
                where: {
                    guildId: interaction.guild.id,
                    userId: member.id,
                    status: { [require('sequelize').Op.in]: ['open', 'claimed'] }
                }
            });

            if (existingTicket) {
                return interaction.reply({
                    content: `❌ You already have an open ticket! <#${existingTicket.channelId}>`,
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });
            const lastTicket = await Ticket.findOne({
                where: { guildId: interaction.guild.id },
                order: [['ticketId', 'DESC']]
            });
            const nextTicketId = (lastTicket?.ticketId || 0) + 1;

            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${nextTicketId}`,
                type: ChannelType.GuildText,
                parent: config.channels?.tickets?.category || null,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles
                        ]
                    },
                    {
                        id: config.roles.staff.moderator,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.ManageMessages
                        ]
                    },
                    {
                        id: config.roles.staff.admin,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.ManageChannels
                        ]
                    }
                ]
            });

            const ticket = await Ticket.create({
                guildId: interaction.guild.id,
                ticketId: nextTicketId,
                channelId: ticketChannel.id,
                userId: member.id,
                userName: member.user.tag,
                category: category
            });

            let categoryInfo = '';
            let categoryEmoji = '🎫';

            switch(category) {
                case 'problem':
                    categoryInfo = 'Please describe your technical issue in detail.';
                    categoryEmoji = '🔧';
                    break;
                case 'staff_apply':
                    categoryInfo = 'Please tell us why you want to become a staff member.';
                    categoryEmoji = '👥';
                    break;
                case 'organization':
                    categoryInfo = 'Please describe your partnership or event proposal.';
                    categoryEmoji = '🏢';
                    break;
                default:
                    categoryInfo = 'Please describe how we can help you.';
                    categoryEmoji = '❓';
            }
            const welcomeEmbed = new EmbedBuilder()
                .setColor(getEmbedColor('info'))
                .setTitle(`${categoryEmoji} Ticket #${nextTicketId} - ${category.replace('_', ' ').toUpperCase()}`)
                .setDescription(`
                    Hello ${member}, welcome to your support ticket!

                    ${categoryInfo}

                    **Guidelines:**
                    • Be as detailed as possible
                    • Include any relevant screenshots or files
                    • Be patient - our staff will respond soon
                    • Keep the conversation respectful
                `)
                .addFields(
                    { name: 'Created by', value: `${member}`, inline: true },
                    { name: 'Category', value: category.replace('_', ' '), inline: true },
                    { name: 'Status', value: '🟢 Open', inline: true }
                )
                .setFooter({ text: `${getServerName()} • Ticket System` })
                .setTimestamp();

            const controlButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_claim')
                        .setLabel('Claim Ticket')
                        .setEmoji('✋')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('Close Ticket')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('ticket_transcript')
                        .setLabel('Save Transcript')
                        .setEmoji('📄')
                        .setStyle(ButtonStyle.Secondary)
                );
            await ticketChannel.send({
                content: `${member} <@&${config.roles.staff.moderator}>`,
                embeds: [welcomeEmbed],
                components: [controlButtons]
            });

            await Log.create({
                guildId: interaction.guild.id,
                type: 'TICKET_CREATE',
                userId: member.id,
                userName: member.user.tag,
                channelId: ticketChannel.id,
                channelName: ticketChannel.name,
                extra: { ticketId: nextTicketId, category: category }
            });

            await interaction.editReply({
                content: `✅ Your ticket has been created: ${ticketChannel}`,
                ephemeral: true
            });

            this.scheduleAutoClose(ticket, ticketChannel);
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'ticket_claim') {
                await this.handleClaim(interaction);
            } else if (interaction.customId === 'ticket_close') {
                await this.handleClose(interaction);
            } else if (interaction.customId === 'ticket_transcript') {
                await this.handleTranscript(interaction);
            } else if (interaction.customId.startsWith('ticket_rate_')) {
                await this.handleRating(interaction);
            }
        }
    },
    async handleClaim(interaction) {
        const ticket = await Ticket.findOne({
            where: {
                channelId: interaction.channel.id,
                status: 'open'
            }
        });

        if (!ticket) {
            return interaction.reply({
                content: '❌ This ticket is not open or does not exist!',
                ephemeral: true
            });
        }

        if (ticket.claimedBy) {
            return interaction.reply({
                content: `❌ This ticket is already claimed by <@${ticket.claimedBy}>!`,
                ephemeral: true
            });
        }

        const member = interaction.member;
        const isStaff = member.roles.cache.has(config.roles.staff.moderator) ||
                       member.roles.cache.has(config.roles.staff.admin);

        if (!isStaff) {
            return interaction.reply({
                content: '❌ Only staff members can claim tickets!',
                ephemeral: true
            });
        }
        ticket.claimedBy = interaction.user.id;
        ticket.claimedByName = interaction.user.tag;
        ticket.status = 'claimed';
        await ticket.save();

        await interaction.channel.setName(`claimed-${ticket.ticketId}`);

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('success'))
            .setTitle('✅ Ticket Claimed')
            .setDescription(`This ticket has been claimed by ${interaction.user}`)
            .addFields(
                { name: 'Staff Member', value: interaction.user.tag, inline: true },
                { name: 'Status', value: '🟡 Claimed', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        await Log.create({
            guildId: interaction.guild.id,
            type: 'TICKET_CLAIM',
            userId: ticket.userId,
            userName: ticket.userName,
            moderatorId: interaction.user.id,
            moderatorName: interaction.user.tag,
            channelId: interaction.channel.id,
            extra: { ticketId: ticket.ticketId }
        });
    },
    async handleClose(interaction) {
        const ticket = await Ticket.findOne({
            where: {
                channelId: interaction.channel.id,
                status: { [require('sequelize').Op.ne]: 'closed' }
            }
        });

        if (!ticket) {
            return interaction.reply({
                content: '❌ This ticket does not exist or is already closed!',
                ephemeral: true
            });
        }

        const member = interaction.member;
        const isStaff = member.roles.cache.has(config.roles.staff.moderator) ||
                       member.roles.cache.has(config.roles.staff.admin);
        const isOwner = ticket.userId === interaction.user.id;

        if (!isStaff && !isOwner) {
            return interaction.reply({
                content: '❌ Only staff members or the ticket owner can close tickets!',
                ephemeral: true
            });
        }

        await interaction.reply('📝 Saving transcript and closing ticket...');

        const messages = await TicketMessage.findAll({
            where: { ticketId: ticket.ticketId },
            order: [['createdAt', 'ASC']]
        });
        let transcript = `Ticket #${ticket.ticketId} - ${ticket.category}\n`;
        transcript += `Created by: ${ticket.userName} (${ticket.userId})\n`;
        transcript += `Closed by: ${interaction.user.tag} (${interaction.user.id})\n`;
        transcript += `Total Messages: ${ticket.messageCount}\n\n`;
        transcript += `--- Transcript ---\n\n`;

        for (const msg of messages) {
            const timestamp = new Date(msg.createdAt).toLocaleString();
            transcript += `[${timestamp}] ${msg.userName}: ${msg.content}\n`;
            if (msg.attachments && msg.attachments.length > 0) {
                transcript += `  Attachments: ${msg.attachments.join(', ')}\n`;
            }
        }

        const buffer = Buffer.from(transcript, 'utf-8');

        const logChannelId = config.channels?.logs?.general;
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(getEmbedColor('info'))
                    .setTitle('📋 Ticket Closed')
                    .setDescription(`Ticket #${ticket.ticketId} has been closed`)
                    .addFields(
                        { name: 'Category', value: ticket.category, inline: true },
                        { name: 'User', value: `<@${ticket.userId}>`, inline: true },
                        { name: 'Closed by', value: interaction.user.tag, inline: true },
                        { name: 'Messages', value: ticket.messageCount.toString(), inline: true },
                        { name: 'Duration', value: `${Math.round((Date.now() - ticket.createdAt) / 3600000)} hours`, inline: true }
                    )
                    .setTimestamp();
                await logChannel.send({
                    embeds: [logEmbed],
                    files: [{
                        attachment: buffer,
                        name: `ticket-${ticket.ticketId}-transcript.txt`
                    }]
                });
            }
        }

        ticket.status = 'closed';
        ticket.closedBy = interaction.user.id;
        ticket.closedByName = interaction.user.tag;
        ticket.closedAt = new Date();
        await ticket.save();

        const user = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
        if (user && !isOwner) {
            await this.sendRatingPrompt(ticket, user);
        }

        setTimeout(() => {
            interaction.channel.delete().catch(console.error);
        }, 5000);
    },

    async handleTranscript(interaction) {
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
        transcript += `Status: ${ticket.status}\n`;
        transcript += `Messages: ${messages.length}\n\n`;
        transcript += `--- Transcript ---\n\n`;

        for (const msg of messages) {
            const timestamp = new Date(msg.createdAt).toLocaleString();
            transcript += `[${timestamp}] ${msg.userName}: ${msg.content}\n`;
        }

        const buffer = Buffer.from(transcript, 'utf-8');

        await interaction.editReply({
            content: '📄 Current ticket transcript:',
            files: [{
                attachment: buffer,
                name: `ticket-${ticket.ticketId}-transcript.txt`
            }]
        });
    },
    async handleRating(interaction) {
        const parts = interaction.customId.split('_');
        const ticketId = parseInt(parts[2]);
        const rating = parseInt(parts[3]);

        const ticket = await Ticket.findOne({
            where: { ticketId: ticketId }
        });

        if (!ticket) {
            return interaction.reply({
                content: '❌ Ticket not found!',
                ephemeral: true
            });
        }

        if (ticket.rating) {
            return interaction.reply({
                content: '❌ You have already rated this ticket!',
                ephemeral: true
            });
        }

        ticket.rating = rating;
        await ticket.save();

        await Log.create({
            guildId: ticket.guildId,
            type: 'TICKET_RATING',
            userId: ticket.userId,
            userName: ticket.userName,
            extra: {
                ticketId: ticket.ticketId,
                rating: rating,
                category: ticket.category
            }
        });
        const stars = '⭐'.repeat(rating);
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('success'))
            .setTitle('Thank you for your feedback!')
            .setDescription(`You rated your support experience: ${stars} (${rating}/5)`)
            .setFooter({ text: getServerName() })
            .setTimestamp();

        await interaction.update({ embeds: [embed], components: [] });
    },

    async sendRatingPrompt(ticket, user) {
        const ratingEmbed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('Rate Your Support Experience')
            .setDescription(`Your ticket #${ticket.ticketId} has been closed.\n\nHow was your experience?`)
            .setFooter({ text: getServerName() });

        const ratingRow = new ActionRowBuilder();
        for (let i = 1; i <= 5; i++) {
            ratingRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket_rate_${ticket.ticketId}_${i}`)
                    .setLabel(`${i}`)
                    .setEmoji('⭐')
                    .setStyle(i <= 2 ? ButtonStyle.Danger : i === 3 ? ButtonStyle.Secondary : ButtonStyle.Success)
            );
        }

        try {
            await user.send({ embeds: [ratingEmbed], components: [ratingRow] });
        } catch (error) {
            console.log('Could not send rating prompt to user');
        }
    },
    scheduleAutoClose(ticket, channel) {
        const autoCloseTime = 24 * 60 * 60 * 1000;

        setTimeout(async () => {
            try {
                const updatedTicket = await Ticket.findOne({
                    where: { ticketId: ticket.ticketId }
                });

                if (!updatedTicket || updatedTicket.status === 'closed') {
                    return;
                }

                const timeSinceActivity = Date.now() - updatedTicket.lastActivity;

                if (timeSinceActivity >= autoCloseTime) {
                    updatedTicket.status = 'closed';
                    updatedTicket.closedBy = 'SYSTEM';
                    updatedTicket.closedByName = 'Auto-Close System';
                    updatedTicket.closedAt = new Date();
                    await updatedTicket.save();

                    const closeEmbed = new EmbedBuilder()
                        .setColor(getEmbedColor('warning'))
                        .setTitle('🔒 Ticket Auto-Closed')
                        .setDescription('This ticket has been automatically closed due to 24 hours of inactivity.')
                        .setTimestamp();

                    await channel.send({ embeds: [closeEmbed] });

                    setTimeout(() => {
                        channel.delete().catch(console.error);
                    }, 60000);

                    await Log.create({
                        guildId: updatedTicket.guildId,
                        type: 'TICKET_AUTO_CLOSE',
                        userId: updatedTicket.userId,
                        userName: updatedTicket.userName,
                        channelId: channel.id,
                        reason: 'Inactivity (24 hours)',
                        extra: { ticketId: updatedTicket.ticketId }
                    });
                } else {
                    this.scheduleAutoClose(updatedTicket, channel);
                }
            } catch (error) {
                console.error('Error in auto-close:', error);
            }
        }, autoCloseTime);
    }
};