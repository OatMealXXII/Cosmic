import { REST, Routes, Client, SlashCommandBuilder } from 'discord.js';
import { configDotenv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { data as playCommand } from '../commands/play.ts';
import { data as stopCommand } from '../commands/stop.ts';
import { data as resume } from '../commands/resume.ts';
import { data as pause } from '../commands/pause.ts';
import { data as info } from '../commands/info.ts';
import { data as node } from '../commands/node.ts';
import { data as queue } from '../commands/queue.ts';
import { data as skip } from '../commands/skip.ts';
import { data as volume } from '../commands/volume.ts';
import { data as setup } from '../commands/setup.ts';
import { data as loop } from '../commands/loop.ts';
import { data as shuffle } from '../commands/shuffle.ts';
import { data as rank } from '../commands/rank.ts';
import { data as leaderboard } from '../commands/leaderboard.ts';
import { data as seek } from '../commands/seek.ts';
import { data as distortion } from '../commands/effects/distortion.ts';
import { data as lowpass } from '../commands/effects/lowpass.ts';
import { data as karaoke } from '../commands/effects/karaoke.ts';

export async function registerCommands(client: Client) {

    const rest = new REST().setToken(process.env.TOKEN!);

    const commands = [
        new SlashCommandBuilder()
            .setName('play')
            .setDescription('เล่นเพลงด้วยการค้นหาหรือใส่ URL')
            .addStringOption(opt =>
                opt.setName('query')
                    .setDescription('Search or URL')
                    .setRequired(true)
            )
            .toJSON(),

        new SlashCommandBuilder()
            .setName('stop')
            .setDescription('หยุดเพลงและออกจากช่องเสียง')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('resume')
            .setDescription('เล่นเพลงต่อจากที่หยุดไว้')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('pause')
            .setDescription('หยุดเพลงชั่วคราว')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('info')
            .setDescription('รายละเอียดเพลงที่กำลังเล่นอยู่')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('node')
            .setDescription('ดูสถานะของระบบต่างๆ')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('queue')
            .setDescription('เพิ่มเพลงไปอยู่ในคิว')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('skip')
            .setDescription('ข้ามเพลงปัจจุบันไปยังเพลงต่อไปในคิว')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('volume')
            .setDescription('เพิ่ม - ลดระดับเสียงเพลง')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('สร้างห้องสั่งเพลง')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('loop')
            .setDescription('ตั้งวนลูปให้เพลง')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('shuffle')
            .setDescription('สลับคิวเพลง')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('rank')
            .setDescription('ดูแรงค์ของคุณ')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('leaderboard')
            .setDescription('ดูอันดับกระดานแรงค์')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('seek')
            .setDescription('จำนวนวินาทีที่ต้องการเลื่อนไป')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('distortion')
            .setDescription('เอฟเฟค Distortion สำหรับเพลง')
            .toJSON(),

            new SlashCommandBuilder()
            .setName('karaoke')
            .setDescription('เอฟเฟค Karaoke สำหรับเพลง')
            .toJSON(),

            new SlashCommandBuilder()
            .setName('lowpass')
            .setDescription('เอฟเฟค LowPass สำหรับเพลง')
            .toJSON(),
    ];

    try {
        await rest.put(Routes.applicationCommands(client.user!.id), {
            body: [
                playCommand.toJSON(),
                stopCommand.toJSON(),
                resume.toJSON(),
                pause.toJSON(),
                node.toJSON(),
                info.toJSON(),
                queue.toJSON(),
                skip.toJSON(),
                volume.toJSON(),
                setup.toJSON(),
                loop.toJSON(),
                shuffle.toJSON(),
                rank.toJSON(),
                leaderboard.toJSON(),
                seek.toJSON(),
                distortion.toJSON(),
                karaoke.toJSON(),
                lowpass.toJSON()
            ]
        });
        console.log('✅ Assign commands successfully!');
    } catch (error) {
        console.error('Error to assign command:', error);
    }
};