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
import { data as volume } from '../commands/volume.ts'
import { data as setup } from '../commands/setup.ts';
import { set } from 'mongoose';

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
            .toJSON,
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
            ]
        });
        console.log('✅ Assign commands successfully!');
    } catch (error) {
        console.error('Error to assign command:', error);
    }
};