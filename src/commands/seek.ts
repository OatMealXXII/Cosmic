import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
    .setName('seek')
    .setDescription('เลื่อนไปยังเวลาที่ต้องการในเพลง')
    .addIntegerOption(option =>
        option.setName('seconds')
            .setDescription('จำนวนวินาทีที่ต้องการเลื่อนไป')
            .setRequired(true)
    );

function parseTimeToSeconds(input: string): number {
    const parts = input.split(':').map(Number);
    if (parts.length === 1) return parts[0]; // วินาที
    if (parts.length === 2) return parts[0] * 60 + parts[1]; // นาที:วินาที
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // ชั่วโมง:นาที:วินาที
    return NaN;
}

function formatSeconds(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const seconds = interaction.options.getInteger('seconds', true);
    const guildId = interaction.guildId!;
    const player = shoukaku.players.get(guildId);

    if (!player || !player.node) {
        return interaction.reply({ content: '❌ ไม่พบผู้เล่นเพลงในเซิร์ฟเวอร์นี้', ephemeral: true });
    }

    const currentTrack = (player as any).currentTrack;
    if (!currentTrack) {
        return interaction.reply({ content: '❌ ไม่มีเพลงที่กำลังเล่นอยู่', ephemeral: true });
    }

    const milliseconds = seconds * 1000;
    if (milliseconds >= currentTrack.info.length) {
        return interaction.reply({ content: '⚠️ คุณไม่สามารถเลื่อนไปไกลเกินความยาวของเพลงได้', ephemeral: true });
    }

    await player.seekTo(milliseconds);
    return interaction.reply({ content: `⏩ เลื่อนไปยัง ${seconds} วินาทีแล้ว!`, ephemeral: true });
}