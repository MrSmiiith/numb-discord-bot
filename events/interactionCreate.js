const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        const { cooldowns } = interaction.client;

        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Map());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1000);
                return interaction.reply({
                    content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
                    flags: ['Ephemeral']
                });
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);

            const errorMessage = {
                content: 'There was an error while executing this command!',
                flags: ['Ephemeral']
            };

            try {
                if (interaction.replied) {
                    await interaction.followUp(errorMessage);
                } else if (interaction.deferred) {
                    await interaction.editReply(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } catch (responseError) {
                console.error('Failed to send error response:', responseError);
                // Don't try to respond again, just log the error
            }
        }
    },
};