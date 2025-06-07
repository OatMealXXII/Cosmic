import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Shoukaku } from 'shoukaku';
import { getMusicChannel, setMusicChannel } from '../utils/channelStorage.ts';

export const musicRoomMap = new Map<string, string>();

export const data = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('สร้างห้องเล่นเพลง');

export async function execute(interaction: ChatInputCommandInteraction, _shoukaku: Shoukaku) {
  const guild = interaction.guild;
  if (!guild) return interaction.reply({ content: '❌ ใช้ได้ในเซิร์ฟเวอร์เท่านั้น', ephemeral: true });
  const existing = getMusicChannel(guild.id);
  if (existing) return interaction.reply({ content: '❌ ตั้งค่าห้องไว้แล้ว', ephemeral: true });

  const channel = await guild.channels.create({
    name: '🎶・Cosmic',
    type: 0,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
    ],
  });

  setMusicChannel(guild.id, channel.id);
  return interaction.reply(`✅ สร้างห้อง ${channel.toString()} สำหรับสั่งเพลงอัตโนมัติแล้ว`);
}
