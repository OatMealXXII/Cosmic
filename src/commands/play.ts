import { Shoukaku } from "shoukaku";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from "../config/config.ts";
import { queueMap } from './queue.ts';
import { playerChannelMap } from "../maps/mapsController.ts";
import { loopModeMap } from "../maps/mapsController.ts";

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

function isValidTrack(track: any): track is {
    encoded: string;
    info: { title: string; uri: string; author: string; length: number };
} {
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

    if (!vc) {
        return await interaction.reply({ content: 'คุณไม่ได้อยู่ในห้องเสียง กรุณาเข้าห้องเสียงก่อน!', ephemeral: true });
    }

    const node = shoukaku.options.nodeResolver(shoukaku.nodes);
    if (!node) return interaction.editReply('❌ Lavalink ยังไม่พร้อมใช้งาน');

    let player = shoukaku.players.get(interaction.guildId!);

    if (!player) {
        player = await shoukaku.joinVoiceChannel({
            guildId: interaction.guildId!,
            channelId: vc.id,
            shardId: 0,
            deaf: true
        });
    }

    const result = await player.node.rest.resolve(query);
    playerChannelMap.set(interaction.guildId!, vc.id);

    if (!result || ['LOAD_FAILED', 'NO_MATCHES'].includes(result.loadType)) {
        return await interaction.reply({
            content: '❌ ไม่พบผลลัพธ์ที่ค้นหา',
            ephemeral: true
        });
    }

    const track = Array.isArray(result.data) ? result.data[0] : result.data;

    if (!isValidTrack(track)) {
        return await interaction.reply({
            content: '❌ ข้อมูลเพลงไม่ถูกต้อง',
            ephemeral: true
        });
    }

    if (!track || !track.encoded || !track.info || !track.info.title) {
        return await interaction.reply({
            content: '❌ ไม่สามารถอ่านข้อมูลเพลงได้',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('เพลงที่กำลังเล่น')
        .setDescription(`กำลังเล่น: **${track.info.title}**`)
        .addFields(
            { name: 'ศิลปิน', value: track.info.author, inline: true },
            { name: 'ความยาว', value: `${(track.info.length / 1000 / 60).toFixed(2)} นาที`, inline: true }
        )
        .setURL(track.info.uri)
        .setTimestamp()
        .setFooter({ text: 'Cosmic - OatMealXXII' });

        
    const queueEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('เพิ่มเพลงไปยังคิว')
        .setDescription(`🎶 เพิ่มเพลง **${track.info.title}** ไปยังคิวแล้ว`)
        .addFields(
            { name: 'ศิลปิน', value: track.info.author, inline: true },
            { name: 'ความยาว', value: `${(track.info.length / 1000 / 60).toFixed(2)} นาที`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Cosmic - OatMealXXII' });

    if (!queueMap.has(guildId!)) queueMap.set(guildId!, []);

    const queue = queueMap.get(guildId!)!;
    player.volume = config.defaultvolume.volume;

    /* const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
    ); */

    if (player.track) {
        queue.push(track);
        return await interaction.reply({
            content: `🎶 เพิ่มเพลง **${track.info.title}** ไปยังคิวแล้ว`,
            embeds: [queueEmbed],
            ephemeral: true
        });
    } else {
        await player.playTrack({ track: { encoded: track.encoded } });
        (player as any).currentTrack = track;
        interaction.reply({
            content: `🎶 กำลังเล่น: **${track.info.title}**`,
            embeds: [embed],
            // components: [row]
        });
    }

    player.on('end', async () => {
        const queue = queueMap.get(guildId!) ?? [];
        const loopMode = loopModeMap.get(guildId!) || 'off';
        const currentTrack = (player as any).currentTrack;

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
        }
        else {
            setTimeout(async () => {
                await player.stopTrack();
                await shoukaku.leaveVoiceChannel(player.guildId);
            }, 30000);
        }
    });
};