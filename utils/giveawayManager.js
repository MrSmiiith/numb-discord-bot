const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Giveaway, GiveawayEntry, GiveawayWinner } = require('./giveawayDatabase');
const { getEmbedColor, getServerName } = require('./branding');

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

class GiveawayManager {
    constructor(client) {
        this.client = client;
        this.checkInterval = null;
    }

    start() {
        this.checkInterval = setInterval(() => {
            this.checkGiveaways();
        }, 30000);

        console.log('🎉 Giveaway Manager started');
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }

    async createGiveaway(data) {
        const giveawayId = generateId();

        const giveaway = await Giveaway.create({
            giveawayId,
            guildId: data.guild.id,
            channelId: data.channel.id,
            messageId: '',
            hostId: data.host.id,
            hostName: data.host.tag,
            prize: data.prize,
            description: data.description,
            winnersCount: data.winners || 1,
            endTime: data.endTime,
            requirements: data.requirements || {},
            isDrop: data.isDrop || false
        });

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('🎉 GIVEAWAY 🎉')
            .setDescription(`**Prize:** ${data.prize}\n${data.description || ''}`)
            .addFields(
                { name: '🏆 Winners', value: `${data.winners || 1}`, inline: true },
                { name: '⏰ Ends', value: `<t:${Math.floor(data.endTime.getTime() / 1000)}:R>`, inline: true },
                { name: '🎯 Hosted By', value: `<@${data.host.id}>`, inline: true }
            )
            .setFooter({ text: `${getServerName()} • ID: ${giveawayId}` })
            .setTimestamp();

        if (data.requirements && Object.keys(data.requirements).length > 0) {
            const reqText = this.formatRequirements(data.requirements);
            embed.addFields({ name: '📋 Requirements', value: reqText, inline: false });
        }

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_${giveawayId}`)
                    .setLabel('0 Entries')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Primary)
            );

        const message = await data.channel.send({ embeds: [embed], components: [button] });

        giveaway.messageId = message.id;
        await giveaway.save();

        if (data.isDrop) {
            await this.handleDropGiveaway(giveaway, message);
        }

        return giveaway;
    }
    async handleDropGiveaway(giveaway, message) {
        const filter = (reaction, user) => reaction.emoji.name === '🎉' && !user.bot;
        const collector = message.createReactionCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async (reaction, user) => {
            giveaway.ended = true;
            await giveaway.save();

            await GiveawayWinner.create({
                giveawayId: giveaway.giveawayId,
                userId: user.id,
                userName: user.tag,
                prize: giveaway.prize
            });

            const embed = EmbedBuilder.from(message.embeds[0])
                .setColor(getEmbedColor('success'))
                .setTitle('🎉 GIVEAWAY ENDED 🎉')
                .addFields({ name: '🏆 Winner', value: `<@${user.id}>`, inline: false });

            await message.edit({ embeds: [embed], components: [] });
            await message.reply(`🎉 Congratulations <@${user.id}>! You won **${giveaway.prize}**!`);
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                giveaway.ended = true;
                giveaway.cancelled = true;
                await giveaway.save();

                const embed = EmbedBuilder.from(message.embeds[0])
                    .setColor(getEmbedColor('error'))
                    .setTitle('🎉 GIVEAWAY ENDED 🎉')
                    .setDescription(`No one reacted in time!\n\n**Prize:** ${giveaway.prize}`);

                await message.edit({ embeds: [embed], components: [] });
            }
        });
    }

    async checkGiveaways() {
        const now = new Date();
        const endedGiveaways = await Giveaway.findAll({
            where: {
                ended: false,
                isDrop: false,
                endTime: { [require('sequelize').Op.lte]: now }
            }
        });

        for (const giveaway of endedGiveaways) {
            await this.endGiveaway(giveaway);
        }
    }

    async endGiveaway(giveaway) {
        try {
            const guild = this.client.guilds.cache.get(giveaway.guildId);
            if (!guild) return;

            const channel = guild.channels.cache.get(giveaway.channelId);
            if (!channel) return;

            const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
            if (!message) return;

            const entries = await GiveawayEntry.findAll({
                where: { giveawayId: giveaway.giveawayId }
            });

            if (entries.length === 0) {
                giveaway.ended = true;
                giveaway.cancelled = true;
                await giveaway.save();

                const embed = EmbedBuilder.from(message.embeds[0])
                    .setColor(getEmbedColor('error'))
                    .setTitle('🎉 GIVEAWAY ENDED 🎉')
                    .setDescription(`No valid entries!\n\n**Prize:** ${giveaway.prize}`);

                await message.edit({ embeds: [embed], components: [] });
                return;
            }

            const winners = await this.selectWinners(entries, giveaway.winnersCount);

            for (const winner of winners) {
                await GiveawayWinner.create({
                    giveawayId: giveaway.giveawayId,
                    userId: winner.userId,
                    userName: winner.userName,
                    prize: giveaway.prize
                });
            }

            giveaway.ended = true;
            await giveaway.save();

            const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');
            const embed = EmbedBuilder.from(message.embeds[0])
                .setColor(getEmbedColor('success'))
                .setTitle('🎉 GIVEAWAY ENDED 🎉')
                .addFields({ name: '🏆 Winner(s)', value: winnerMentions, inline: false });

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`giveaway_reroll_${giveaway.giveawayId}`)
                        .setLabel('Reroll')
                        .setEmoji('🔄')
                        .setStyle(ButtonStyle.Secondary)
                );

            await message.edit({ embeds: [embed], components: [button] });
            await channel.send(`🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!\nContact <@${giveaway.hostId}> to claim your prize!`);

        } catch (error) {
            console.error('Error ending giveaway:', error);
        }
    }
    async selectWinners(entries, count) {
        const weightedEntries = [];
        for (const entry of entries) {
            for (let i = 0; i < entry.entryCount; i++) {
                weightedEntries.push(entry);
            }
        }

        const shuffled = weightedEntries.sort(() => 0.5 - Math.random());
        const winners = [];
        const selectedUserIds = new Set();

        for (const entry of shuffled) {
            if (!selectedUserIds.has(entry.userId)) {
                winners.push(entry);
                selectedUserIds.add(entry.userId);
                if (winners.length >= count) break;
            }
        }

        return winners;
    }

    async rerollGiveaway(giveawayId, interaction) {
        const giveaway = await Giveaway.findOne({ where: { giveawayId } });
        if (!giveaway || !giveaway.ended) return null;

        const entries = await GiveawayEntry.findAll({
            where: { giveawayId: giveaway.giveawayId }
        });

        const previousWinners = await GiveawayWinner.findAll({
            where: { giveawayId: giveaway.giveawayId, rerolled: false }
        });

        for (const winner of previousWinners) {
            winner.rerolled = true;
            await winner.save();
        }

        const validEntries = entries.filter(e =>
            !previousWinners.some(w => w.userId === e.userId)
        );

        if (validEntries.length === 0) {
            await interaction.reply({
                content: '❌ No valid entries left for reroll!',
                ephemeral: true
            });
            return null;
        }

        const newWinners = await this.selectWinners(validEntries, giveaway.winnersCount);

        for (const winner of newWinners) {
            await GiveawayWinner.create({
                giveawayId: giveaway.giveawayId,
                userId: winner.userId,
                userName: winner.userName,
                prize: giveaway.prize
            });
        }

        return newWinners;
    }

    formatRequirements(requirements) {
        const lines = [];

        if (requirements.minLevel) {
            lines.push(`• **Minimum Level:** ${requirements.minLevel}`);
        }
        if (requirements.minMessages) {
            lines.push(`• **Minimum Messages:** ${requirements.minMessages}`);
        }
        if (requirements.requiredRoles && requirements.requiredRoles.length > 0) {
            const roles = requirements.requiredRoles.map(r => `<@&${r}>`).join(', ');
            lines.push(`• **Required Roles:** ${roles}`);
        }
        if (requirements.boosterMultiplier && requirements.boosterMultiplier > 1) {
            lines.push(`• **Booster Bonus:** ${requirements.boosterMultiplier}x entries`);
        }

        return lines.join('\n') || 'None';
    }

    async checkRequirements(member, requirements) {
        if (requirements.minLevel) {
        }

        if (requirements.minMessages) {
        }

        if (requirements.requiredRoles && requirements.requiredRoles.length > 0) {
            const hasRequiredRole = requirements.requiredRoles.some(roleId =>
                member.roles.cache.has(roleId)
            );
            if (!hasRequiredRole) return false;
        }

        return true;
    }

    async getEntryMultiplier(member, requirements) {
        let multiplier = 1;

        if (requirements.boosterMultiplier && member.premiumSince) {
            multiplier = requirements.boosterMultiplier;
        }

        return multiplier;
    }
}

module.exports = GiveawayManager;