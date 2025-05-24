import { Client, Message } from 'discord.js';
import { Shoukaku } from 'shoukaku';
import { getMusicChannel } from '../utils/channelStorage.ts';

export function setupAutoPlay(client: Client, shoukaku: Shoukaku) {
  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    const musicChannelId = getMusicChannel(message.guild.id);
    if (!musicChannelId || message.channel.id !== musicChannelId) return;

    const url = message.content.trim();
    if (!url.startsWith('http')) return;

    const member = message.guild.members.cache.get(message.author.id);
    const voiceChannel = member?.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ กรุณาเข้าห้องเสียงก่อนส่งลิงก์เพลง');
    }

    try {
      const node = shoukaku.options.nodeResolver(shoukaku.nodes);
      if (!node) return message.reply('❌ Lavalink ไม่พร้อมใช้งาน');

      const player = await shoukaku.joinVoiceChannel({
        guildId: message.guildId!,
        channelId: voiceChannel.id,
        shardId: 0,
        deaf: true,
      });

      const result = await node.rest.resolve(url);
      if (!result || !Array.isArray(result.data) || result.data.length === 0) {
        return message.reply('❌ ไม่พบผลลัพธ์');
      }

      const track = result.data[0];
      await player.playTrack({ track: { encoded: track.encoded } });

      message.reply(`🎶 กำลังเล่น: **${track.info.title}**`);
    } catch (err) {
      console.error(err);
      message.reply('❌ เกิดข้อผิดพลาดในการเล่นเพลง');
    }
  });
}
