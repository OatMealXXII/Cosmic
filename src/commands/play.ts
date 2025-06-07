import { Shoukaku } from "shoukaku";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AutocompleteInteraction } from 'discord.js';
import config from "../config/config.ts";
import { queueMap } from './queue.ts';
import { playerChannelMap, loopModeMap, disconnectTimeouts } from "../maps/mapsController.ts";
import { updateStats } from '../utils/stats.ts';
import { createMusicButtons, createSecondaryButtons } from '../handlers/buttonHandler.ts';

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
        option.setName('query').setDescription('ใส่ชื่อเพลงหรือใส่ URL').setRequired(true).setAutocomplete(true)
    );

function isValidTrack(track: any): track is Track {
    return typeof track?.encoded === 'string' &&
        typeof track?.info?.title === 'string' &&
        typeof track?.info?.uri === 'string' &&
        typeof track?.info?.author === 'string' &&
        typeof track?.info?.length === 'number';
}

function isURL(str: string): boolean {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

function formatSearchQuery(query: string): string {
    if (isURL(query)) {
        return query;
    }

    return `spsearch:${query}`;
}

export async function autocomplete(interaction: AutocompleteInteraction, shoukaku?: Shoukaku) {
    const focusedValue = interaction.options.getFocused();

    if (!focusedValue || focusedValue.length < 2) {
        const popularSuggestions = [
            'Idol - Yoasobi',
            'Payphone - Maroon 5',
            'Shape of You - Ed Sheeran',
            'oath sign - LiSA',
            'BIRDS OF A FEATHER - Billie Eilish',
            'Ghost - JUSTIN BIEBER',
        ];

        return await interaction.respond(
            popularSuggestions.map(song => ({ name: `🎵 ${song}`, value: song }))
        );
    }

    try {
        if (isURL(focusedValue)) {
            return await interaction.respond([
                { name: `🔗 ${focusedValue}`, value: focusedValue }
            ]);
        }

        if (!shoukaku) {
            const client = interaction.client as any;
            shoukaku = client.shoukaku || client.music || client.lavalink;

            if (!shoukaku) {
                return await interaction.respond([
                    { name: `🔍 ค้นหา: ${focusedValue}`, value: focusedValue }
                ]);
            }
        }

        const node = shoukaku.options.nodeResolver(shoukaku.nodes);
        if (!node || !node.rest) {
            return await interaction.respond([
                { name: `🔍 ค้นหา: ${focusedValue}`, value: focusedValue }
            ]);
        }

        const searchQuery = `spsearch:${focusedValue}`;

        const searchPromise = node.rest.resolve(searchQuery);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Search timeout')), 3000)
        );

        const result = await Promise.race([searchPromise, timeoutPromise]) as { loadType: string; data: any[] };

        if (result && result.loadType === 'search' && Array.isArray(result.data) && result.data.length > 0) {

            const suggestions = result.data
                .slice(0, 20)
                .filter((track: any) => {
                    const isValid = isValidTrack(track);
                    return isValid;
                })
                .map((track: Track) => {
                    try {
                        const title = track.info?.title || 'Unknown Title';
                        const author = track.info?.author || 'Unknown Artist';
                        const duration = track.info?.length ? formatDuration(track.info.length) : '00:00';

                        const displayName = `🎵 ${title} - ${author} [${duration}]`;

                        return {
                            name: displayName.length > 100 ? displayName.substring(0, 97) + '...' : displayName,
                            value: track.info?.uri || track.info?.title || focusedValue
                        };
                    } catch (error) {
                        return null;
                    }
                })
                .filter((suggestion): suggestion is { name: string; value: string } => suggestion !== null)
                .slice(0, 25);

            if (suggestions.length > 0) {
                return await interaction.respond(suggestions);
            }
        }

        return await interaction.respond([
            { name: `🔍 ค้นหา: ${focusedValue}`, value: focusedValue }
        ]);

    } catch (error) {
        return await interaction.respond([
            { name: `🔍 ค้นหา: ${focusedValue} (ข้อผิดพลาด)`, value: focusedValue }
        ]);
    }
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

    const primaryButtons = createMusicButtons(player);
    const secondaryButtons = createSecondaryButtons();

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
                    content: `❌ บอทกําลังเล่นเพลงในช่อง <#${playerChannel}> อยู่แล้ว`
                });
            }
        }

        playerChannelMap.set(guildId, vc.id);

        const searchQuery = formatSearchQuery(query);

        const result = await player.node.rest.resolve(searchQuery);

        if (!result || ['LOAD_FAILED', 'NO_MATCHES'].includes(result.loadType)) {
            return await interaction.editReply({
                content: `❌ ไม่พบผลลัพธ์สําหรับ "${query}" โปรดลองค้นหาด้วยคําอื่น`,
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
                .setDescription(`🎶 เพิ่มเพลงในเพลย์ลิสต์ ${playlistName} จํานวน ${validTracks.length} เพลง`)
                .setTimestamp()
                .setFooter({ text: 'Cosmic - OatMealXXII' });

            if (!player.track || player.paused) {
                const firstTrack = validTracks[0];
                await player.playTrack({ track: { encoded: firstTrack.encoded } });
                (player as any).currentTrack = firstTrack;

                updateStats({ lastSong: firstTrack.info.title, songsPlayed: 1 }, firstTrack.info.uri);

                if (validTracks.length > 1) {
                    queue.push(...validTracks.slice(1));
                }

                const nowPlayingEmbed = createNowPlayingEmbed(firstTrack);
                await interaction.editReply({
                    embeds: [nowPlayingEmbed],
                    components: [primaryButtons, secondaryButtons]
                });
            } else {
                queue.push(...validTracks);
                await interaction.editReply({
                    content: `เพิ่มเพลย์ลิสต์ ${playlistName} ไปยังคิวแล้ว`,
                    embeds: [playlistEmbed]
                });
            }
        } else if (result.loadType === 'search') {
            const tracks = Array.isArray(result.data) ? result.data : [result.data];
            const firstTrack = tracks[0];

            if (!isValidTrack(firstTrack)) {
                return await interaction.editReply({
                    content: `❌ ไม่พบเพลงที่ตรงกับ "${query}"`,
                });
            }

            if (player.track && !player.paused) {
                queue.push(firstTrack);
                const queueEmbed = createQueueEmbed(firstTrack);
                await interaction.editReply({
                    content: `🎶 เพิ่มเพลง **${firstTrack.info.title}** ไปยังคิวแล้ว`,
                    embeds: [queueEmbed]
                });
            } else {
                await player.playTrack({ track: { encoded: firstTrack.encoded } });
                updateStats({ lastSong: firstTrack.info.title, songsPlayed: 1 }, firstTrack.info.uri);
                (player as any).currentTrack = firstTrack;
                const nowPlayingEmbed = createNowPlayingEmbed(firstTrack);
                await interaction.editReply({
                    embeds: [nowPlayingEmbed],
                    components: [primaryButtons, secondaryButtons]
                });
            }
        } else {
            const track = result.data;
            if (!isValidTrack(track)) {
                return await interaction.editReply({
                    content: `❌ ไม่สามารถเล่นเพลงจาก "${query}" ได้`,
                });
            }

            if (player.track && !player.paused) {
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
                const nowPlayingEmbed = createNowPlayingEmbed(track);
                await interaction.editReply({
                    embeds: [nowPlayingEmbed],
                    components: [primaryButtons, secondaryButtons]
                });
            }
        }
    } catch (error) {
        await interaction.editReply({
            content: '❌ เกิดข้อผิดพลาดในการเล่นเพลง โปรดลองอีกครั้งในภายหลัง'
        });
    }
}

function setupPlayerEvents(player: any, shoukaku: Shoukaku, guildId: string) {
    player.removeAllListeners('end');
    player.removeAllListeners('start');

    player.on('start', async (track: any) => {
        const currentTrack = player.currentTrack;
        if (currentTrack) {
            updateStats({ lastSong: currentTrack.info.title }, currentTrack.info.uri);

            try {
                const channel = player.voiceConnection?.channelId;
                if (channel) {
                    const guild = (player.node as any).client?.guilds?.cache?.get(guildId);
                    const textChannel = guild?.channels?.cache?.find((ch: any) =>
                        ch.type === 0 && ch.name.includes('music') || ch.name.includes('bot')
                    );

                    if (textChannel) {
                        const nowPlayingEmbed = createNowPlayingEmbed(track);
                        await textChannel.send({
                            embeds: [nowPlayingEmbed],
                            components: [createMusicButtons(player), createSecondaryButtons()]
                        });
                    }
                }
            } catch (error) {
            }
        }
    });

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
                player.currentTrack = nextTrack;

                await player.playTrack({ track: { encoded: nextTrack.encoded } });
                updateStats({ lastSong: nextTrack.info.title }, nextTrack.info.uri);

            } else {
                player.currentTrack = null;


                const timeout = setTimeout(async () => {
                    try {
                        const currentPlayer = shoukaku.players.get(guildId);
                        const currentQueue = queueMap.get(guildId) ?? [];
                        if (currentPlayer && !currentPlayer.track && currentQueue.length === 0) {
                            await currentPlayer.stopTrack();
                            await shoukaku.leaveVoiceChannel(guildId);
                            playerChannelMap.delete(guildId);
                            queueMap.delete(guildId);
                        }
                    } catch (error) {
                    }
                }, 30000);

                disconnectTimeouts.set(guildId, timeout);
            }
        } catch (error) {
        }
    });

    player.on('error', (error: any) => {
    });
}

function createNowPlayingEmbed(track: Track): EmbedBuilder {
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('เพลงที่กําลังเล่น')
        .setDescription(`กําลังเล่น: **${track.info.title}**`)
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