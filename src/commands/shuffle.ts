import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { queueMap } from './queue.ts';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('สับเปลี่ยนลำดับเพลงในคิวแบบสุ่ม');

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const guildId = interaction.guildId!;
    const queue = queueMap.get(guildId);
    const player = shoukaku.players.get(guildId);

    if (!queue || queue.length === 0) {
        return await interaction.reply({
            content: '❌ ไม่มีเพลงในคิว ไม่สามารถสับเปลี่ยนได้',
            ephemeral: true
        });
    }

    if (!player) {
        return await interaction.reply({
            content: '❌ ไม่มีการเล่นเพลงอยู่',
            ephemeral: true
        });
    }

    const shuffledQueue = shuffleArray([...queue]);
    queueMap.set(guildId, shuffledQueue);

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🔀 สับเปลี่ยนคิวเพลง')
        .setDescription(`สับเปลี่ยนลำดับเพลงในคิวจำนวน ${queue.length} เพลงเรียบร้อยแล้ว`)
        .addFields(
            { 
                name: '🎵 เพลงที่กำลังเล่น', 
                value: `${(player as any).currentTrack?.info?.title || 'ไม่ทราบชื่อเพลง'}`,
                inline: false 
            },
            { 
                name: '📑 เพลงถัดไป', 
                value: shuffledQueue[0]?.info?.title || 'ไม่มีเพลงถัดไป',
                inline: true 
            }
        )
        .setTimestamp()
        .setFooter({ text: 'Cosmic - OatMealXXII' });

    await interaction.reply({ embeds: [embed] });
}