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
import * as volume from '../commands/volume.ts';
import * as setup from '../commands/setup.ts';
import * as loop from '../commands/loop.ts';
import * as shuffle from '../commands/shuffle.ts';
import * as rank from '../commands/rank.ts';
import * as leaderboard from '../commands/leaderboard.ts';
import * as seek from '../commands/seek.ts';
import * as distortion from '../commands/effects/distortion.ts';
import * as lowpass from '../commands/effects/lowpass.ts';
import * as karaoke from '../commands/effects/karaoke.ts';
import * as help from '../commands/help.ts';
import * as ping from '../commands/ping.ts';
import * as lofi from '../commands/effects/lofi.ts';
import * as nightcore from '../commands/effects/nightcore.ts';
import * as vaporwave from '../commands/effects/vaporwave.ts';
import * as clearFilters from '../commands/effects/clearFilters.ts';
import { handleButton } from './buttonHandler.ts';

export async function handleInteraction(
  interaction: ChatInputCommandInteraction,
  shoukaku: Shoukaku
) {
  if (interaction.isButton()) {
    return handleButton(interaction, shoukaku);
  }

  if (!interaction.isChatInputCommand()) return;
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
    case 'skip':
      return skip.execute(interaction, shoukaku);
    case 'volume':
      return volume.execute(interaction, shoukaku);
    case 'setup':
      return setup.execute(interaction, shoukaku);
    case 'loop':
      return loop.execute(interaction, shoukaku);
    case 'shuffle':
      return shuffle.execute(interaction, shoukaku);
    case 'rank':
      return rank.execute(interaction, shoukaku);
    case 'leaderboard':
      return leaderboard.execute(interaction, shoukaku);
    case 'seek':
      return seek.execute(interaction, shoukaku);
    case 'distortion':
      return distortion.execute(interaction, shoukaku);
    case 'karaoke':
      return karaoke.execute(interaction, shoukaku);
    case 'lowpass':
      return lowpass.execute(interaction, shoukaku);
    case 'help':
      return help.execute(interaction, shoukaku);
    case 'ping':
      return ping.execute(interaction, shoukaku);
    case 'lofi':
      return lofi.execute(interaction, shoukaku);
    case 'nightcore':
      return nightcore.execute(interaction, shoukaku);
    case 'vaporwave':
      return vaporwave.execute(interaction, shoukaku);
    case 'clearfilters':
      return clearFilters.execute(interaction, shoukaku);
  }

  if (interaction.isButton()) {
    return handleButton(interaction, shoukaku);
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