const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { Giveaway, GiveawayEntry } = require('../utils/giveawayDatabase');
const { getEmbedColor } = require('../utils/branding');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId.startsWith('giveaway_') && !interaction.customId.includes('reroll')) {
            const giveawayId = interaction.customId.replace('giveaway_', '');
            await handleGiveawayEntry(interaction, giveawayId);
        }

        if (interaction.customId.startsWith('giveaway_reroll_')) {
            const giveawayId = interaction.customId.replace('giveaway_reroll_', '');
            await handleGiveawayReroll(interaction, giveawayId);
        }
    }
};

async function handleGiveawayEntry(interaction, giveawayId) {
    await interaction.deferReply({ ephemeral: true });

    const giveaway = await Giveaway.findOne({ where: { giveawayId } });

    if (!giveaway) {
        return interaction.editReply('❌ Giveaway not found!');
    }

    if (giveaway.ended) {
        return interaction.editReply('❌ This giveaway has ended!');
    }

    const manager = interaction.client.giveawayManager;
    const meetsRequirements = await manager.checkRequirements(interaction.member, giveaway.requirements);

    if (!meetsRequirements) {
        const reqText = manager.formatRequirements(giveaway.requirements);
        return interaction.editReply(`❌ You don't meet the requirements!\n\n**Requirements:**\n${reqText}`);
    }

    let entry = await GiveawayEntry.findOne({
        where: {
            giveawayId: giveawayId,
            userId: interaction.user.id
        }
    });

    if (entry) {
        await entry.destroy();

        await updateGiveawayButton(interaction.message, giveawayId, -entry.entryCount);

        await interaction.editReply('✅ You have left the giveaway!');
    } else {
        const multiplier = await manager.getEntryMultiplier(interaction.member, giveaway.requirements);

        entry = await GiveawayEntry.create({
            giveawayId: giveawayId,
            userId: interaction.user.id,
            userName: interaction.user.tag,
            entryCount: multiplier,
            isBooster: interaction.member.premiumSince ? true : false
        });

        await updateGiveawayButton(interaction.message, giveawayId, multiplier);

        const entryText = multiplier > 1
            ? `✅ You entered with **${multiplier}x** entries (Booster bonus)!`
            : '✅ You have entered the giveaway!';

        await interaction.editReply(entryText);
    }
}
async function updateGiveawayButton(message, giveawayId, change) {
    const totalEntries = await GiveawayEntry.sum('entryCount', {
        where: { giveawayId: giveawayId }
    }) || 0;

    const uniqueEntries = await GiveawayEntry.count({
        where: { giveawayId: giveawayId }
    });

    const button = ActionRowBuilder.from(message.components[0]);
    button.components[0].setLabel(`${uniqueEntries} Users (${totalEntries} Entries)`);

    await message.edit({ components: [button] }).catch(() => {});
}

async function handleGiveawayReroll(interaction, giveawayId) {
    const giveaway = await Giveaway.findOne({ where: { giveawayId } });

    if (!giveaway) {
        return interaction.reply({ content: '❌ Giveaway not found!', ephemeral: true });
    }

    if (giveaway.hostId !== interaction.user.id &&
        !interaction.member.permissions.has(require('discord.js').PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: '❌ Only the host or administrators can reroll this giveaway!',
            ephemeral: true
        });
    }

    const manager = interaction.client.giveawayManager;
    const winners = await manager.rerollGiveaway(giveawayId, interaction);

    if (winners && winners.length > 0) {
        const winnerMentions = winners.map(w => `<@${w.userId}>`).join(', ');

        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        const fields = embed.data.fields || [];

        const winnerFieldIndex = fields.findIndex(f => f.name === '🏆 Winner(s)');
        if (winnerFieldIndex !== -1) {
            fields[winnerFieldIndex].value = `${winnerMentions} (Rerolled)`;
        }

        await interaction.message.edit({ embeds: [embed] });
        await interaction.reply(`🔄 **Rerolled!** New winner(s): ${winnerMentions}\nContact <@${giveaway.hostId}> to claim your prize!`);
    }
}