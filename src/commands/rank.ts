import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getGuildXP } from '../utils/xpManager.ts';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription("แสดง XP และระดับของคุณ");

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const guildXP = getGuildXP(guildId);

  const user = guildXP[userId];
  if (!user) {
    return interaction.reply({ content: 'คุณยังไม่มี XP ในเซิร์ฟเวอร์นี้!', ephemeral: true });
  }

  const sorted = Object.entries(guildXP)
    .sort(([, a], [, b]) => b.level * 50 + b.xp - (a.level * 50 + a.xp));
  const rank = sorted.findIndex(([id]) => id === userId) + 1;

  return interaction.reply({
    embeds: [{
      title: `📊 ข้อมูล XP ของคุณ`,
      description: `🔹 ระดับ: **${user.level}**\n🔹 XP: **${user.xp}**\n🔹 อันดับ: **#${rank}**`,
      color: 0x00AE86
    }],
    ephemeral: true
  });
}
