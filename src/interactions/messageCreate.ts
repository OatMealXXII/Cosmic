import {
    getUserXP,
    addXP,
    updateLastMessage,
    canGainXP
} from '../utils/xpManager';
import { GatewayIntentBits, Client, ChatInputCommandInteraction } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const cooldown = 60 * 1000;
    const userId = message.author.id;
    const guildId = message.guild.id;

    if (!canGainXP(userId, guildId, cooldown)) return;

    const randomXP = Math.floor(Math.random() * 10) + 5;
    const { user, leveledUp } = addXP(userId, guildId, randomXP);
    updateLastMessage(userId, guildId);

    if (leveledUp) {
        try {
            await message.author.send(`🎉 Congratulations! You've reached level ${user.level} for Cosmic Bot! 🎂`);
        } catch (err) {
            console.error('❌ Cannot send DM to user:', err);
        }
    }
});