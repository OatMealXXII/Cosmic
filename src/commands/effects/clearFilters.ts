import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
    .setName('clearfilters')
    .setDescription('🗑️ ล้างเอฟเฟคทั้งหมด');

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

    await player!.clearFilters();
    return interaction.reply({ 
        content: `🗑️ ล้างเอฟเฟคทั้งหมดแล้ว!`, 
        ephemeral: true 
    });
}