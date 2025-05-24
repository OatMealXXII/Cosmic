import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
    .setName('distortion')
    .setDescription('เอฟฟเฟค Distortion สำหรับเพลง');

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
    if (filters?.distortion) {
        await player!.clearFilters();
        return interaction.reply({ content: `ปิดเอฟเฟค Lowpass แล้ว!`, ephemeral: true });
    }

    await player!.setDistortion({
        sinOffset: 0,
        sinScale: 1,
        cosOffset: 0,
        cosScale: 1,
        tanOffset: 0,
        tanScale: 1,
        offset: 0,
        scale: 1
    });
    return interaction.reply({ content: `เปิดเอฟเฟค Distortion แล้ว!`, ephemeral: true });
}