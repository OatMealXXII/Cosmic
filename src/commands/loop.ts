import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { loopModeMap } from '../maps/mapsController.ts';

export const data = new SlashCommandBuilder()
  .setName('loop')
  .setDescription('ตั้งค่าโหมดวนซ้ำเพลง')
  .addStringOption(option =>
    option
      .setName('mode')
      .setDescription('เลือกโหมด')
      .setRequired(true)
      .addChoices(
        { name: 'ปิด', value: 'off' },
        { name: 'วนเพลงเดียว', value: 'one' },
        { name: 'วนทั้งคิว', value: 'all' },
      )
  );

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: unknown) {
  const mode = interaction.options.getString('mode', true) as 'off' | 'one' | 'all';
  loopModeMap.set(interaction.guildId!, mode);

  await interaction.reply({
    content: `🔁 ตั้งค่าโหมดวนซ้ำเป็น **${mode.toUpperCase()}** แล้ว`,
    ephemeral: true,
  });
}
