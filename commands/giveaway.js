const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Giveaway, GiveawayEntry, GiveawayWinner } = require('../utils/giveawayDatabase');
const { getEmbedColor, getServerName } = require('../utils/branding');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new giveaway')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('What are you giving away?')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('How long? (e.g., 1h, 30m, 1d)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners (default: 1)')
                        .setMinValue(1)
                        .setMaxValue(20))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Additional description'))
                .addRoleOption(option =>
                    option.setName('required_role')
                        .setDescription('Role required to enter'))
                .addIntegerOption(option =>
                    option.setName('min_messages')
                        .setDescription('Minimum messages required')
                        .setMinValue(1))
                .addIntegerOption(option =>
                    option.setName('booster_multiplier')
                        .setDescription('Entry multiplier for boosters (e.g., 2 = 2x entries)')
                        .setMinValue(1)
                        .setMaxValue(5))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to host giveaway (default: current)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('drop')
                .setDescription('Start a drop giveaway (first to react wins)')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('What are you giving away?')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Additional description'))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to host drop (default: current)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a giveaway early')
                .addStringOption(option =>
                    option.setName('giveaway_id')
                        .setDescription('Giveaway ID to end')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reroll')
                .setDescription('Reroll giveaway winners')
                .addStringOption(option =>
                    option.setName('giveaway_id')
                        .setDescription('Giveaway ID to reroll')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List active giveaways'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel a giveaway')
                .addStringOption(option =>
                    option.setName('giveaway_id')
                        .setDescription('Giveaway ID to cancel')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch(subcommand) {
            case 'start':
                await this.startGiveaway(interaction);
                break;
            case 'drop':
                await this.startDropGiveaway(interaction);
                break;
            case 'end':
                await this.endGiveaway(interaction);
                break;
            case 'reroll':
                await this.rerollGiveaway(interaction);
                break;
            case 'list':
                await this.listGiveaways(interaction);
                break;
            case 'cancel':
                await this.cancelGiveaway(interaction);
                break;
        }
    },

    async startGiveaway(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const prize = interaction.options.getString('prize');
        const duration = interaction.options.getString('duration');
        const winners = interaction.options.getInteger('winners') || 1;
        const description = interaction.options.getString('description');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const requiredRole = interaction.options.getRole('required_role');
        const minMessages = interaction.options.getInteger('min_messages');
        const boosterMultiplier = interaction.options.getInteger('booster_multiplier');

        const durationMs = ms(duration);
        if (!durationMs || durationMs < 60000) {
            return interaction.editReply('❌ Invalid duration! Minimum 1 minute.');
        }

        if (durationMs > 30 * 24 * 60 * 60 * 1000) {
            return interaction.editReply('❌ Maximum duration is 30 days!');
        }

        const requirements = {};
        if (requiredRole) requirements.requiredRoles = [requiredRole.id];
        if (minMessages) requirements.minMessages = minMessages;
        if (boosterMultiplier) requirements.boosterMultiplier = boosterMultiplier;

        const manager = interaction.client.giveawayManager;
        const endTime = new Date(Date.now() + durationMs);

        const giveaway = await manager.createGiveaway({
            guild: interaction.guild,
            channel: channel,
            host: interaction.user,
            prize: prize,
            description: description,
            winners: winners,
            endTime: endTime,
            requirements: requirements,
            isDrop: false
        });

        await interaction.editReply(`✅ Giveaway started in ${channel}!\n**ID:** ${giveaway.giveawayId}`);
    },
    async startDropGiveaway(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const prize = interaction.options.getString('prize');
        const description = interaction.options.getString('description');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        const manager = interaction.client.giveawayManager;
        const endTime = new Date(Date.now() + 60000);

        const giveaway = await manager.createGiveaway({
            guild: interaction.guild,
            channel: channel,
            host: interaction.user,
            prize: prize,
            description: description || 'First to react wins!',
            winners: 1,
            endTime: endTime,
            requirements: {},
            isDrop: true
        });

        await interaction.editReply(`✅ Drop giveaway started in ${channel}!\nFirst to react wins!`);
    },

    async endGiveaway(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const giveawayId = interaction.options.getString('giveaway_id');
        const giveaway = await Giveaway.findOne({ where: { giveawayId } });

        if (!giveaway) {
            return interaction.editReply('❌ Giveaway not found!');
        }

        if (giveaway.ended) {
            return interaction.editReply('❌ This giveaway has already ended!');
        }

        const manager = interaction.client.giveawayManager;
        await manager.endGiveaway(giveaway);

        await interaction.editReply('✅ Giveaway ended successfully!');
    },

    async rerollGiveaway(interaction) {
        await interaction.deferReply();

        const giveawayId = interaction.options.getString('giveaway_id');
        const manager = interaction.client.giveawayManager;

        const winners = await manager.rerollGiveaway(giveawayId, interaction);

        if (winners && winners.length > 0) {
            const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');
            await interaction.editReply(`🔄 **Rerolled!** New winner(s): ${winnerMentions}`);
        }
    },
    async listGiveaways(interaction) {
        await interaction.deferReply();

        const activeGiveaways = await Giveaway.findAll({
            where: {
                guildId: interaction.guild.id,
                ended: false
            }
        });

        if (activeGiveaways.length === 0) {
            return interaction.editReply('No active giveaways found!');
        }

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('🎉 Active Giveaways')
            .setDescription(`Found ${activeGiveaways.length} active giveaway(s)`)
            .setFooter({ text: getServerName() })
            .setTimestamp();

        for (const giveaway of activeGiveaways.slice(0, 10)) {
            const entryCount = await GiveawayEntry.count({
                where: { giveawayId: giveaway.giveawayId }
            });

            embed.addFields({
                name: `🎁 ${giveaway.prize}`,
                value: `**ID:** ${giveaway.giveawayId}\n**Winners:** ${giveaway.winnersCount}\n**Entries:** ${entryCount}\n**Ends:** <t:${Math.floor(giveaway.endTime.getTime() / 1000)}:R>\n**Host:** <@${giveaway.hostId}>`,
                inline: true
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    async cancelGiveaway(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const giveawayId = interaction.options.getString('giveaway_id');
        const giveaway = await Giveaway.findOne({ where: { giveawayId } });

        if (!giveaway) {
            return interaction.editReply('❌ Giveaway not found!');
        }

        if (giveaway.ended) {
            return interaction.editReply('❌ This giveaway has already ended!');
        }

        if (giveaway.hostId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.editReply('❌ Only the host or administrators can cancel this giveaway!');
        }

        giveaway.ended = true;
        giveaway.cancelled = true;
        await giveaway.save();

        const channel = interaction.guild.channels.cache.get(giveaway.channelId);
        if (channel) {
            const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
            if (message) {
                const embed = EmbedBuilder.from(message.embeds[0])
                    .setColor(getEmbedColor('error'))
                    .setTitle('🎉 GIVEAWAY CANCELLED 🎉')
                    .setDescription(`This giveaway was cancelled by ${interaction.user}\n\n**Prize:** ${giveaway.prize}`);

                await message.edit({ embeds: [embed], components: [] });
            }
        }

        await interaction.editReply('✅ Giveaway cancelled successfully!');
    }
};