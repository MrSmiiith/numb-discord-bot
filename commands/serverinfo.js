const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get detailed server information')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const guild = interaction.guild;
        await guild.fetch();

        const serverAge = Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24));

        const channels = guild.channels.cache;
        const textChannels = channels.filter(c => c.type === 0).size;
        const voiceChannels = channels.filter(c => c.type === 2).size;
        const categories = channels.filter(c => c.type === 4).size;
        const forumChannels = channels.filter(c => c.type === 15).size;
        const stageChannels = channels.filter(c => c.type === 13).size;

        const members = guild.members.cache;
        const bots = members.filter(m => m.user.bot).size;
        const humans = guild.memberCount - bots;
        const online = members.filter(m => m.presence?.status === 'online').size;
        const boosters = guild.premiumSubscriptionCount || 0;

        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };
        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle(`🏰 ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '🆔 Server ID', value: guild.id, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n(${serverAge} days ago)`, inline: true },

                { name: '👥 Members', value: `Total: ${guild.memberCount}\nHumans: ${humans}\nBots: ${bots}`, inline: true },
                { name: '💚 Online', value: online.toString(), inline: true },
                { name: '🚀 Boosters', value: `${boosters} (Level ${guild.premiumTier})`, inline: true },

                { name: '📝 Channels', value: `Text: ${textChannels}\nVoice: ${voiceChannels}\nCategories: ${categories}${forumChannels ? `\nForums: ${forumChannels}` : ''}${stageChannels ? `\nStages: ${stageChannels}` : ''}`, inline: true },
                { name: '😀 Emojis', value: `${guild.emojis.cache.size}/${guild.emojis.cache.size < 50 ? '50' : guild.emojis.cache.size < 100 ? '100' : '250'}`, inline: true },
                { name: '🎭 Roles', value: guild.roles.cache.size.toString(), inline: true },

                { name: '🛡️ Verification', value: verificationLevels[guild.verificationLevel], inline: true },
                { name: '🗺️ Region', value: guild.preferredLocale, inline: true },
                { name: '📍 Features', value: guild.features.length > 0 ? guild.features.slice(0, 3).map(f => f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())).join(', ') : 'None', inline: true }
            );

        if (guild.banner) {
            embed.setImage(guild.bannerURL({ size: 512 }));
        }

        if (guild.vanityURLCode) {
            embed.addFields({ name: '🔗 Vanity URL', value: `discord.gg/${guild.vanityURLCode}`, inline: true });
        }

        embed.setFooter({ text: getServerName() }).setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};