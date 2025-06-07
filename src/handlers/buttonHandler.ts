import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { Shoukaku, Player, Track } from 'shoukaku';
import { queueMap } from '../commands/queue.ts';

export async function handleButton(interaction: ButtonInteraction, shoukaku: Shoukaku): Promise<void> {
    const player = shoukaku.players.get(interaction.guildId!);

    if (!player) {
        await interaction.reply({
            content: '❌ ไม่มีเพลงที่กำลังเล่นอยู่',
            ephemeral: true
        });
        return;
    }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channel;
    const botVoiceChannel = interaction.guild?.members.cache.get(interaction.client.user.id)?.voice.channel;

    if (!voiceChannel || voiceChannel.id !== botVoiceChannel?.id) {
        await interaction.reply({
            content: '❌ คุณต้องอยู่ในห้องเสียงเดียวกันกับบอท',
            ephemeral: true
        });
    }

    try {
        switch (interaction.customId) {
            case 'music_pause':
                await handlePauseResume(interaction, player);
                break;

            case 'music_skip':
                await handleSkip(interaction, player);
                break;

            case 'music_stop':
                await handleStop(interaction, player, shoukaku);
                break;

            case 'music_loop':
                await handleLoop(interaction, player);
                break;

            case 'music_shuffle':
                await handleShuffle(interaction, player);
                break;

            case 'music_volume_down':
                await handleVolumeDown(interaction, player);
                break;

            case 'music_volume_up':
                await handleVolumeUp(interaction, player);
                break;

            case 'music_queue':
                await handleQueue(interaction, player);
                break;

            default:
                await interaction.reply({
                    content: '❌ ปุ่มที่ไม่รู้จัก',
                    ephemeral: true
                });
        }
    } catch (error) {
        console.error('Button handler error:', error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ เกิดข้อผิดพลาดในการประมวลผลคำขอ',
                ephemeral: true
            });
        }
    }
}

async function handlePauseResume(interaction: ButtonInteraction, player: Player): Promise<void> {
    if (player.paused) {
        await player.resume();
        await interaction.reply({
            content: '▶️ เล่นเพลงต่อแล้ว',
            ephemeral: true
        });
    } else {
        await player.setPaused(true);
        await interaction.reply({
            content: '⏸️ หยุดเพลงชั่วคราวแล้ว',
            ephemeral: true
        });
    }
}

async function handleSkip(interaction: ButtonInteraction, player: Player): Promise<void> {
    const queue = (player as any).queue || [];

    if (queueMap.size === 0) {
        await player.stopTrack();
        await interaction.reply({
            content: '❌ ไม่มีเพลงในคิว',
            ephemeral: true
        });
    } else {
        await player.stopTrack();
        await interaction.reply({
            content: '⏭️ ข้ามเพลงแล้ว',
            ephemeral: true
        });
    }
}

async function handleStop(interaction: ButtonInteraction, player: Player, shoukaku: Shoukaku): Promise<void> {
    await player.stopTrack();
    await shoukaku.leaveVoiceChannel(player.guildId!);
    await player.destroy();
    shoukaku.players.delete(interaction.guildId!);

    await interaction.reply({
        content: '⏹️ หยุดเพลงและออกจากห้องเสียงแล้ว',
        ephemeral: true
    });
}

async function handleLoop(interaction: ButtonInteraction, player: Player): Promise<void> {
    const currentLoop = (player as any).loop || 'none';
    let newLoop: string;
    let message: string;

    switch (currentLoop) {
        case 'none':
            newLoop = 'track';
            message = '🔂 เปิดการวนซ้ำเพลงปัจจุบัน';
            break;
        case 'track':
            newLoop = 'queue';
            message = '🔁 เปิดการวนซ้ำคิว';
            break;
        case 'queue':
            newLoop = 'none';
            message = '➡️ ปิดการวนซ้ำ';
            break;
        default:
            newLoop = 'none';
            message = '➡️ ปิดการวนซ้ำ';
    }

    (player as any).loop = newLoop;

    await interaction.reply({
        content: message,
        ephemeral: true
    });
}

async function handleShuffle(interaction: ButtonInteraction, player: Player): Promise<void> {
    const guildId = interaction.guildId!;
    const queue = queueMap.get(guildId) ?? [];
    function shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const shuffledQueue = shuffleArray([...queue]);
    queueMap.set(guildId, shuffledQueue);

    await interaction.reply({
        content: '🔀 สับเปลี่ยนคิวแล้ว',
        ephemeral: true
    });
}

async function handleVolumeDown(interaction: ButtonInteraction, player: Player): Promise<void> {
    const currentVolume = (player as any).volume || 100;
    const newVolume = Math.max(0, currentVolume - 10);

    await player.setGlobalVolume(newVolume);
    (player as any).volume = newVolume;

    await interaction.reply({
        content: `🔉 ลดเสียงเป็น: ${newVolume}%`,
        ephemeral: true
    });
}

async function handleVolumeUp(interaction: ButtonInteraction, player: Player): Promise<void> {
    const currentVolume = (player as any).volume || 100;
    const newVolume = Math.min(200, currentVolume + 10);

    await player.setGlobalVolume(newVolume);
    (player as any).volume = newVolume;

    await interaction.reply({
        content: `🔊 เพิ่มเสียงเป็น: ${newVolume}%`,
        ephemeral: true
    });
}

async function handleQueue(interaction: ButtonInteraction, player: Player): Promise<void> {
    const SONGS_PER_PAGE = 10;
    const queue = queueMap.get(interaction.guildId!) ?? [];
    const currentTrack = (player as any).currentTrack;

    if (!currentTrack && queue.length === 0) {
        await interaction.reply({
            content: '❌ ไม่มีเพลงในคิว',
            ephemeral: true
        });
        return;
    }

    const pages = Math.ceil(queue.length / SONGS_PER_PAGE);
    const currentPage = 0;

    const start = currentPage * SONGS_PER_PAGE;
    const end = Math.min(start + SONGS_PER_PAGE, queue.length);
    const pageQueue = queue.slice(start, end);

    const description = pageQueue
        .map((track, i) => `${start + i + 1}. ${track.info.title} - ${track.info.author}`)
        .join('\n');

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎶 คิวเพลง')
        .setDescription(description || 'ไม่มีเพลงในคิว')
        .setTimestamp()
        .setFooter({ text: 'Cosmic - OatMealXXII' });

    if (currentTrack) {
        embed.addFields({
            name: '🎵 กำลังเล่น',
            value: `${currentTrack.info.title} - ${currentTrack.info.author}`,
            inline: false
        });
    }

    if (queue.length > 0) {
        embed.addFields({
            name: '📊 สถานะคิว',
            value: `หน้า 1/${pages}\nเพลงทั้งหมด: ${queue.length} เพลง`,
            inline: true
        });
    }

    await interaction.reply({
        embeds: [embed],
    });
}

export function createMusicButtons(player?: Player): ActionRowBuilder<ButtonBuilder> {
    const isPaused = player?.paused || false;

    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('music_pause')
                .setEmoji(isPaused ? '▶️' : '⏸️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('music_skip')
                .setEmoji('⏭️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('music_stop')
                .setEmoji('⏹️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('music_loop')
                .setEmoji('🔁')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_queue')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Secondary)
        );
}

export function createSecondaryButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('music_volume_down')
                .setEmoji('🔉')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_volume_up')
                .setEmoji('🔊')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('music_shuffle')
                .setEmoji('🔀')
                .setStyle(ButtonStyle.Secondary)
        );
}

export function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}