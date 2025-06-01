import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
    .setName('lofi')
    .setDescription('🎵 เอฟเฟค Lo-Fi สำหรับเพลง (ฟังสบายๆทำงาน เรียน)');

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const guildId = interaction.guildId!;
    const player = shoukaku.players.get(guildId);

    if (!player || !player.node) {
        return interaction.reply({ content: '❌ ไม่พบผู้เล่นเพลงในเซิร์ฟเวอร์นี้', ephemeral: true });
    }

    const currentTrack = (player as any).currentTrack;
    if (!currentTrack) {
        return interaction.reply({ content: '❌ ไม่มีเพลงที่กำลังเล่นอยู่', ephemeral: true });
    }

    const filters = (player as any).filters;
    if (filters?.lowPass?.smoothing === 20.0) {
        await player!.clearFilters();
        return interaction.reply({ content: `🎵 ปิดเอฟเฟค Lo-Fi แล้ว!`, ephemeral: true });
    }

    await player!.setLowPass({
        smoothing: 20.0
    });

    await player!.setEqualizer([
        { band: 0, gain: 0.25 },
        { band: 1, gain: 0.15 },
        { band: 2, gain: 0.1 },
        { band: 3, gain: 0.05 },
        { band: 4, gain: 0.0 },
        { band: 5, gain: -0.05 },
        { band: 6, gain: -0.1 },
        { band: 7, gain: -0.15 },
        { band: 8, gain: -0.2 },
        { band: 9, gain: -0.25 },
        { band: 10, gain: -0.3 },
        { band: 11, gain: -0.35 },
        { band: 12, gain: -0.4 },
        { band: 13, gain: -0.45 },
        { band: 14, gain: -0.5 }
    ]);

    await player!.setTimescale({
        speed: 0.9,
        pitch: 0.95,
        rate: 1
    });

    return interaction.reply({ 
        content: `🎵 เปิดเอฟเฟค Lo-Fi แล้ว! (Warm + Smooth sound)`, 
        ephemeral: true 
    });
}