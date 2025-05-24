import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getGuildXP } from '../utils/xpManager.ts';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription("แสดงอันดับผู้ที่มี XP สูงสุดในเซิร์ฟเวอร์");

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
  const guildId = interaction.guildId!;
  const guildXP = getGuildXP(guildId);

  const sorted = Object.entries(guildXP)
    .sort(([, a], [, b]) => b.level * 50 + b.xp - (a.level * 50 + a.xp))
    .slice(0, 10);

  if (sorted.length === 0) {
    return interaction.reply("ยังไม่มีใครมี XP ในเซิร์ฟเวอร์นี้เลย!");
  }

  const leaderboard = await Promise.all(
    sorted.map(async ([userId, userData], index) => {
      const member = await interaction.guild?.members.fetch(userId).catch(() => null);
      const name = member?.user.username || `Unknown User`;
      return `**#${index + 1}** - ${name} : Level ${userData.level} (${userData.xp} XP)`;
    })
  );

  return interaction.reply({
    embeds: [{
      title: `🏆 อันดับ XP ในเซิร์ฟเวอร์`,
      description: leaderboard.join('\n'),
      color: 0xFFD700
    }]
  });
}
