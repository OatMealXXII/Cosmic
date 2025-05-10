import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Shoukaku } from 'shoukaku';

function isValidTrack(track: any): track is {
    encoded: string;
    info: { title: string; uri: string; author: string; length: number };
} {
    return (
        track &&
        typeof track.encoded === 'string' &&
        track.info &&
        typeof track.info.title === 'string' &&
        typeof track.info.uri === 'string' &&
        typeof track.info.author === 'string' &&
        typeof track.info.length === 'number'
    );
}

export const data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('แสดงข้อมูลเพลงที่กำลังเล่นอยู่');

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    try {
        const guildId = interaction.guildId;
        const player = shoukaku.players.get(interaction.guildId!);
        if (!player) {
            return interaction.reply({
                content: '❌ ไม่มีเพลงที่กำลังเล่นอยู่ในขณะนี้',
                ephemeral: true
            });
        }
        
        const track = (player as any).currentTrack;

        if (!isValidTrack(track)) {
            return interaction.reply({
                content: '❌ ไม่พบข้อมูลของเพลง',
                ephemeral: true
            });
        }
        const info = track.info;

        const embed = new EmbedBuilder()
            .setTitle('🎶 เพลงที่กำลังเล่นอยู่')
            .addFields(
                { name: 'ชื่อเพลง', value: info.title || 'ไม่ทราบ' },
                { name: 'ศิลปิน', value: info.author || 'ไม่ทราบ', inline: true },
                { name: 'ความยาว', value: info.length ? `${(info.length / 1000 / 60).toFixed(2)} นาที` : 'ไม่ทราบ', inline: true }
            )
            .setURL(info.uri || null)
            .setColor('#00ff99')
            .setTimestamp()
            .setFooter({ text: 'Cosmic - OatMealXXII' });

        return interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในคำสั่ง /info:', error);
        return interaction.reply({
            content: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลเพลง',
            ephemeral: true
        });
    }
}

function setFooter(arg0: { text: string; }) {
    throw new Error('Function not implemented.');
}
