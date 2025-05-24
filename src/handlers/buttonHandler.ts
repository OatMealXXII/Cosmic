import { ButtonInteraction } from "discord.js";
import { Shoukaku } from "shoukaku";
import { queueMap } from "../commands/queue.ts";
import * as info from '../commands/info.ts'

export async function handleButton(interaction: ButtonInteraction, shoukaku: Shoukaku) {
    const player = shoukaku.players.get(interaction.guildId!);
    if (!player) return await interaction.reply({ content: '❌ ไม่มีเพลงที่เล่นอยู่', ephemeral: true });

    switch (interaction.customId) {
        case 'toggle-playback':
            if (player.paused) {
                await player.setPaused(false);
                await interaction.reply({ content: '▶️ เล่นต่อแล้ว', ephemeral: true });
            } else {
                await player.setPaused(true);
                await interaction.reply({ content: '⏸ หยุดชั่วคราวแล้ว', ephemeral: true });
            }
            break;
        case 'stop-playback':
            await player.stopTrack();
            await shoukaku.leaveVoiceChannel(player.guildId);
            queueMap.set(interaction.guildId!, []);
            await interaction.reply({ content: '⏹ หยุดเล่นเพลงแล้ว', ephemeral: true });
            break;
        case 'skip-track':
            const queue = queueMap.get(interaction.guildId!) ?? [];
            const nextTrack = queue.shift();
            if (nextTrack) {
                await player.playTrack({ track: { encoded: nextTrack.encoded } });
                await interaction.reply({ content: `⏭ ข้ามไปเล่นเพลง: **${nextTrack.info.title}**`, ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ ไม่มีเพลงถัดไปในคิว', ephemeral: true });
            }
            break;
        case 'show-nowplaying':
            await interaction.reply({ content: 'ข้อมูลเพลงที่เล่นอยู่ตอนนี้'});
            info.execute(interaction, shoukaku)
    }
}
