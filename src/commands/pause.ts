import { Shoukaku } from "shoukaku";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('หยุดเพลงไว้ชั่วคราว')

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
        await player.setPaused(true);
        await interaction.reply({
            content: '⏸️ หยุดเพลงไว้ชั่วคราวเรียบร้อยแล้ว',
            ephemeral: true
          });
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: '⚠️ เกิดข้อผิดพลาดขณะหยุดเพลงไว้ชั่วคราว',
            ephemeral: true
          });
    }
}