import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getStats } from '../utils/stats.ts';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('📊 แสดงสถิติของบอท');

export async function execute(interaction: ChatInputCommandInteraction) {
  const stats = getStats();
  return interaction.reply({
    embeds: [
      {
        title: '📈 สถิติของบอท',
        color: 0x00AE86,
        fields: [
          { name: '👥 ผู้ใช้งานทั้งหมด', value: `${stats.users}`, inline: true },
          { name: '🎵 เพลงที่เปิดทั้งหมด', value: `${stats.songsPlayed}`, inline: true },
          { name: '🎶 เพลงล่าสุด', value: stats.lastSong || "ไม่มี", inline: false }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  });
}
