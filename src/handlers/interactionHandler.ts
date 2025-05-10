import { ChatInputCommandInteraction } from 'discord.js';
import { Shoukaku } from 'shoukaku';
import * as play from '../commands/play.ts';
import * as stop from '../commands/stop.ts';
import * as resume from '../commands/resume.ts';
import * as pause from '../commands/pause.ts';
import * as info from '../commands/info.ts';
import * as nodeCommand from '../commands/node.ts';
import * as queue from '../commands/queue.ts';
import * as skip from '../commands/skip.ts';
import * as volume from '../commands/volume.ts'
import * as setup from '../commands/setup.ts'

export async function handleInteraction(
  interaction: ChatInputCommandInteraction,
  shoukaku: Shoukaku
) {
  switch (interaction.commandName) {
    case 'play':
      return play.execute(interaction, shoukaku);
    case 'stop':
      return stop.execute(interaction, shoukaku);
    case 'resume':
      return resume.execute(interaction, shoukaku);
    case 'pause':
      return pause.execute(interaction, shoukaku);
    case 'info':
      return info.execute(interaction, shoukaku);
    case 'node':
      return nodeCommand.execute(interaction, shoukaku);
    case 'queue':
      return queue.execute(interaction, shoukaku);
    case 'skip' :
      return skip.execute(interaction, shoukaku);
    case 'volume' :
       return volume.execute(interaction, shoukaku);
    case 'setup' :
       return setup.execute(interaction, shoukaku)
  }

  const query = interaction.options.getString('query', true);
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel) {
    return interaction.reply({ content: '❌ คุณไม่ได้อยู่ในห้องเสียง', ephemeral: true });
  }

  await interaction.deferReply();

  const node = shoukaku.options.nodeResolver(shoukaku.nodes);
  if (!node) return interaction.editReply('Lavalink ไม่พร้อมใช้งาน');

  const player = await shoukaku.joinVoiceChannel({
    guildId: interaction.guildId!,
    channelId: voiceChannel.id,
    shardId: 0,
    deaf: true
  });

  const result = await node.rest.resolve(query);
  if (!result || !Array.isArray(result.data) || result.data.length === 0) {
    return interaction.editReply('ไม่พบผลลัพธ์');
  }

  const track = result.data[0];
  await player.playTrack({ track: { encoded: track.encoded } });

  interaction.editReply(`🎶 กำลังเล่น: **${track.info.title}**`);
};