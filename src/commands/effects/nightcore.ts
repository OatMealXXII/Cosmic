import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
    .setName('nightcore')
    .setDescription('🌙 เอฟเฟค Nightcore สำหรับเพลง (สำหรับเล่นเกม + ปลุกใจ)');

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
    if (filters?.timescale?.speed === 1.25 && filters?.timescale?.pitch === 1.25) {
        await player!.clearFilters();
        return interaction.reply({ content: `🌙 ปิดเอฟเฟค Nightcore แล้ว!`, ephemeral: true });
    }

    await player!.setTimescale({
        speed: 1.25,
        pitch: 1.25,
        rate: 1
    });

    await player!.setEqualizer([
        { band: 0, gain: 0.1 },
        { band: 1, gain: 0.1 },
        { band: 2, gain: 0.05 },
        { band: 3, gain: 0.05 },
        { band: 4, gain: 0.0 },
        { band: 5, gain: 0.0 },
        { band: 6, gain: 0.0 },
        { band: 7, gain: 0.0 },
        { band: 8, gain: 0.0 },
        { band: 9, gain: 0.0 },
        { band: 10, gain: 0.0 },
        { band: 11, gain: 0.0 },
        { band: 12, gain: 0.0 },
        { band: 13, gain: 0.0 },
        { band: 14, gain: 0.0 }
    ]);

    return interaction.reply({ 
        content: `🌙 เปิดเอฟเฟค Nightcore แล้ว! (Speed: 1.25x, Pitch: +25%)`, 
        ephemeral: true 
    });
}