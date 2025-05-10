import { ChatInputCommandInteraction, Guild, SlashCommandBuilder } from 'discord.js';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('หยุดเพลงและออกจากช่องเสียง');

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
  const value = interaction.options.getNumber('value', true);
  const player = shoukaku.players.get(interaction.guildId!);
  const guildId = interaction.guildId;

  if (!player || !player.node) {
    return await interaction.reply({
      content: '❌ ไม่มีเพลงที่กำลังเล่นอยู่ หรือบอทไม่ได้อยู่ในช่องเสียง',
      ephemeral: true
    });
  }

  try {
    await player.stopTrack();
    await shoukaku.leaveVoiceChannel(player.guildId)
    await interaction.reply({
        content: '⏹️ หยุดเล่นเพลงและออกจากช่องเสียงเรียบร้อยแล้ว',
        ephemeral: true
      });
  } catch (error) {
    console.error(error);
    await interaction.reply({
        content: '⚠️ เกิดข้อผิดพลาดขณะหยุดเพลง',
        ephemeral: true
      });
  }
}
