import { VoiceState, Client } from 'discord.js';
import { Shoukaku } from 'shoukaku';

const leaveTimeouts = new Map<string, NodeJS.Timeout>();

export default function handleVoiceStateUpdate(client: Client, shoukaku: Shoukaku) {
    client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
        const guildId = oldState.guild.id;

        if (oldState.channelId === newState.channelId) return;

        const channel = oldState.channel;
        if (!channel) return;

        const bot = channel.guild.members.me;
        if (!bot || !channel.members.has(bot.id)) return;

        const nonBots = channel.members.filter(m => !m.user.bot);
        const player = shoukaku.players.get(guildId);
        if (!player) return;

        if (nonBots.size === 0) {
            if (leaveTimeouts.has(guildId)) return;

            const timeout = setTimeout(() => {
                shoukaku.leaveVoiceChannel(guildId)
                leaveTimeouts.delete(guildId);
            }, 5000);

            leaveTimeouts.set(guildId, timeout);
        } else {
            const timeout = leaveTimeouts.get(guildId);
            if (timeout) {
                clearTimeout(timeout);
                leaveTimeouts.delete(guildId);
            }
        }
    });
}
