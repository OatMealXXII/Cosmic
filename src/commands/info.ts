import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { Shoukaku } from 'shoukaku';

function isValidTrack(track: any): track is {
  encoded: string;
  info: {
    title: string;
    uri: string;
    author: string;
    length: number;
    identifier: string;
    isStream: boolean;
    sourceName: string;
  };
} {
  return (
    track &&
    typeof track.encoded === 'string' &&
    track.info &&
    typeof track.info.title === 'string'
  );
}

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('แสดงข้อมูลเพลงที่กำลังเล่นอยู่');

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
  try {
    const player = shoukaku.players.get(interaction.guildId!);
    if (!player) {
      return interaction.reply({
        content: '❌ ไม่มีเพลงที่กำลังเล่นอยู่ในขณะนี้',
        ephemeral: true
      });
    }

    const track = (player as any).currentTrack;
    if (!isValidTrack(track)) {
      return interaction.reply({
        content: '❌ ไม่พบข้อมูลของเพลง',
        ephemeral: true
      });
    }

    const info = track.info;
    const position = player.position ?? 0;
    const isLooping = (player as any).loop ?? false;
    const volume = player.volume;

    const progress = `${formatTime(position)} / ${formatTime(info.length)}`;
    const embed = new EmbedBuilder()
      .setTitle('🎶 ข้อมูลเพลงที่กำลังเล่น')
      .addFields(
        { name: '🎵 ชื่อเพลง', value: `[${info.title}](${info.uri})` },
        { name: '🎤 ศิลปิน', value: info.author, inline: true },
        { name: '🕒 ความยาว', value: progress, inline: true },
        { name: '🔁 Loop', value: isLooping ? 'เปิดอยู่' : 'ปิดอยู่', inline: true },
        { name: '🔊 Volume', value: `${volume}%`, inline: true },
        { name: '📥 แหล่งที่มา', value: info.sourceName || 'ไม่ทราบ', inline: true }
      )
      .setColor('#00ff99')
      .setTimestamp()
      .setFooter({ text: 'Cosmic - OatMealXXII' });

    return interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในคำสั่ง /info:', error);
    return interaction.reply({
      content: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลเพลง',
      ephemeral: true
    });
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}