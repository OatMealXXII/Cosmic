import { Shoukaku } from "shoukaku";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('เล่นเพลงต่อจากที่หยุดไว้')

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
  const player = shoukaku.players.get(interaction.guildId!);
  const guildId = interaction.guildId;

  if (!player || !player.node) {
    return await interaction.reply({
      content: '❌ ไม่มีเพลงที่กำลังเล่นอยู่ หรือบอทไม่ได้อยู่ในช่องเสียง',
      ephemeral: true
    });
  }

  try {
    await player.setPaused(false);
    await interaction.reply({
      content: '▶️ เล่นเพลงต่อจากที่หยุดไว้เรียบร้อยแล้ว',
      ephemeral: true
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '⚠️ เกิดข้อผิดพลาดขณะเล่นเพลงต่อจากที่หยุดไว้',
      ephemeral: true
    });
  }
}