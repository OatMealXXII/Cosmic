import { Shoukaku } from "shoukaku";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from "../config/config.ts";
import { queueMap } from './queue.ts';
import { playerChannelMap, loopModeMap, disconnectTimeouts } from "../maps/mapsController.ts";
import { updateStats } from '../utils/stats.ts';

type Track = {
    encoded: string;
    info: {
        title: string;
        uri: string;
        author: string;
        length: number;
    };
};

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('เล่นเพลงด้วยการค้นหาหรือใส่ URL')
    .addStringOption(option =>
        option.setName('query').setDescription('ใส่ชื่อเพลงหรือใส่ URL').setRequired(true)
    );

function isValidTrack(track: any): track is Track {
    return typeof track?.encoded === 'string' &&
        typeof track?.info?.title === 'string' &&
        typeof track?.info?.uri === 'string' &&
        typeof track?.info?.author === 'string' &&
        typeof track?.info?.length === 'number';
}

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const query = interaction.options.getString('query', true);
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const vc = member?.voice.channel;
    const guildId = interaction.guildId;

    if (!guildId) {
        return await interaction.reply({ content: '❌ ไม่พบ Guild ID', ephemeral: true });
    }

    if (!vc) {
        return await interaction.reply({ content: 'คุณไม่ได้อยู่ในห้องเสียง กรุณาเข้าห้องเสียงก่อน!', ephemeral: true });
    }

    const node = shoukaku.options.nodeResolver(shoukaku.nodes);
    if (!node) return interaction.reply({ content: '❌ Lavalink ยังไม่พร้อมใช้งาน', ephemeral: true });

    let player = shoukaku.players.get(guildId);

    if (disconnectTimeouts.has(guildId)) {
        clearTimeout(disconnectTimeouts.get(guildId)!);
        disconnectTimeouts.delete(guildId);
    }

    await interaction.deferReply();

    try {
        if (!player) {
            player = await shoukaku.joinVoiceChannel({
                guildId: guildId,
                channelId: vc.id,
                shardId: 0,
                deaf: true
            });

            setupPlayerEvents(player, shoukaku, guildId);
        } else {
            const playerChannel = playerChannelMap.get(guildId);
            if (playerChannel && playerChannel !== vc.id) {
                return await interaction.editReply({
                    content: `❌ บอทกำลังเล่นเพลงในช่อง <#${playerChannel}> อยู่แล้ว`
                });
            }
        }

        playerChannelMap.set(guildId, vc.id);

        const result = await player.node.rest.resolve(query);

        if (!result || ['LOAD_FAILED', 'NO_MATCHES'].includes(result.loadType)) {
            return await interaction.editReply({
                content: '❌ ไม่พบผลลัพธ์ที่ค้นหา',
            });
        }

        if (!queueMap.has(guildId)) queueMap.set(guildId, []);
        const queue = queueMap.get(guildId)!;
        
        if (player.volume !== config.defaultvolume.volume) {
            player.volume = config.defaultvolume.volume;
        }

        if (result.loadType === 'playlist') {
            const playlist = result.data;
            const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
            const validTracks = tracks
                .filter(isValidTrack)
                .map(track => ({
                    ...track,
                    info: {
                        ...track.info,
                        uri: track.info.uri ?? ""
                    }
                }));

            if (validTracks.length === 0) {
                return await interaction.editReply({
                    content: '❌ ไม่พบเพลงที่เล่นได้ในเพลย์ลิสต์นี้',
                });
            }

            const playlistName = playlist.info?.name || 'เพลย์ลิสต์';
            const playlistEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`เพิ่มเพลย์ลิสต์: ${playlistName}`)
                .setDescription(`🎶 เพิ่มเพลงในเพลย์ลิสต์ ${playlistName} จำนวน ${validTracks.length} เพลง`)
                .setTimestamp()
                .setFooter({ text: 'Cosmic - OatMealXXII' });

            if (!player.track) {
                const firstTrack = validTracks[0];
                await player.playTrack({ track: { encoded: firstTrack.encoded } });
                (player as any).currentTrack = firstTrack;

                updateStats({ lastSong: firstTrack.info.title, songsPlayed: 1 }, firstTrack.info.uri);
                
                if (validTracks.length > 1) {
                    queue.push(...validTracks.slice(1));
                    updateStats({ lastSong: firstTrack.info.title, songsPlayed: 1 }, firstTrack.info.uri);
                }

                const row = createControlRow();
                await interaction.editReply({
                    content: `🎶 กำลังเล่น: **${firstTrack.info.title}**\nเพิ่มเพลงในเพลย์ลิสต์ ${playlistName} อีก ${validTracks.length - 1} เพลง`,
                    embeds: [createNowPlayingEmbed(firstTrack), playlistEmbed],
                    components: [row]
                });
            } else {
                queue.push(...validTracks);
                await interaction.editReply({
                    content: `เพิ่มเพลย์ลิสต์ ${playlistName} ไปยังคิวแล้ว`,
                    embeds: [playlistEmbed]
                });
            }
        } else {
            const track = result.data;
            if (!isValidTrack(track)) {
                return await interaction.editReply({
                    content: '❌ ข้อมูลเพลงไม่ถูกต้อง',
                });
            }

            if (player.track) {
                queue.push(track);
                const queueEmbed = createQueueEmbed(track);
                await interaction.editReply({
                    content: `🎶 เพิ่มเพลง **${track.info.title}** ไปยังคิวแล้ว`,
                    embeds: [queueEmbed]
                });
            } else {
                await player.playTrack({ track: { encoded: track.encoded } });
                updateStats({ lastSong: track.info.title, songsPlayed: 1 }, track.info.uri);
                (player as any).currentTrack = track;
                const row = createControlRow();
                await interaction.editReply({
                    content: `🎶 กำลังเล่น: **${track.info.title}**`,
                    embeds: [createNowPlayingEmbed(track)],
                    components: [row]
                });
            }
        }
    } catch (error) {
        console.error('Error in play command:', error);
        await interaction.editReply({
            content: '❌ เกิดข้อผิดพลาดในการเล่นเพลง โปรดลองอีกครั้งในภายหลัง'
        });
    }
}

function setupPlayerEvents(player: any, shoukaku: Shoukaku, guildId: string) {
    player.removeAllListeners('end');
    
    player.on('end', async (data: any) => {
        try {
            if (data.reason === 'replaced') return;
            
            const queue = queueMap.get(guildId) ?? [];
            const loopMode = loopModeMap.get(guildId) || 'off';
            const currentTrack = player.currentTrack;

            if (loopMode === 'one' && currentTrack) {
                await player.playTrack({ track: { encoded: currentTrack.encoded } });
                return;
            }

            if (loopMode === 'all' && currentTrack) {
                queue.push(currentTrack);
            }

            const nextTrack = queue.shift();
            if (nextTrack) {
                await player.playTrack({ track: { encoded: nextTrack.encoded } });
                updateStats({ lastSong: nextTrack.info.title }, nextTrack.info.uri);
                player.currentTrack = nextTrack;
            } else {
                const timeout = setTimeout(async () => {
                    try {
                        const currentPlayer = shoukaku.players.get(guildId);
                        if (currentPlayer && !currentPlayer.track) {
                            await currentPlayer.stopTrack();
                            await shoukaku.leaveVoiceChannel(guildId);
                            playerChannelMap.delete(guildId);
                        }
                        disconnectTimeouts.delete(guildId);
                    } catch (error) {
                        console.error('Error during player cleanup:', error);
                    }
                }, 30000);
                
                disconnectTimeouts.set(guildId, timeout);
            }
        } catch (error) {
            console.error('Error in player end event:', error);
        }
    });

    player.on('error', (error: any) => {
        console.error(`Player error in guild ${guildId}:`, error);
    });
}

function createNowPlayingEmbed(track: Track): EmbedBuilder {
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('เพลงที่กำลังเล่น')
        .setDescription(`กำลังเล่น: **${track.info.title}**`)
        .addFields(
            { name: 'ศิลปิน', value: track.info.author || 'ไม่ทราบ', inline: true },
            { name: 'ความยาว', value: formatDuration(track.info.length), inline: true }
        )
        .setURL(track.info.uri)
        .setTimestamp()
        .setFooter({ text: 'Cosmic - OatMealXXII' });
}

function createQueueEmbed(track: Track): EmbedBuilder {
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('เพิ่มเพลงไปยังคิว')
        .setDescription(`🎶 เพิ่มเพลง **${track.info.title}** ไปยังคิวแล้ว`)
        .addFields(
            { name: 'ศิลปิน', value: track.info.author || 'ไม่ทราบ', inline: true },
            { name: 'ความยาว', value: formatDuration(track.info.length), inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Cosmic - OatMealXXII' });
}

function formatDuration(milliseconds: number): string {
    if (!milliseconds || milliseconds <= 0) return '0:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function createControlRow(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('show-nowplaying')
            .setLabel('🎵')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('toggle-playback')
            .setLabel('⏯️')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('skip-track')
            .setLabel('⏭️')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('stop-track')
            .setLabel('⏹️')
            .setStyle(ButtonStyle.Danger),
    );
}