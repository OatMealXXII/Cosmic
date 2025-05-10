import { Shoukaku } from "shoukaku";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

type Track = {
    encoded: string;
    info: {
        title: string;
        uri: string;
        author: string;
        length: number;
    };
};

export const queueMap = new Map<string, Track[]>();

export const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('แสดงคิวเพลงที่กำลังเล่นอยู่')

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const queue = queueMap.get(interaction.guildId!) ?? [];
    const guild = interaction.guildId;
    const player = shoukaku.players.get(guild!)

    if (!queue.length) {
        return interaction.reply('📭 คิวว่างเปล่า');
    }

    const track = (player as any).currentTrack;
    const info = track.info;
    const list = queue.map((track, i) => `${i + 1}. ${track.info.title}`).join('\n');
    const authorList = queue.map((track) => `${track.info.author}`).join('\n');

    const embed = new EmbedBuilder()
        .setTitle('🎶 คิวเพลง')
        .setDescription(`${list.slice(0, 4000)} ศิลปิน: ${authorList}`)
        .setFooter({ text: 'Cosmic - OatMealXXII' });

    return interaction.reply({ embeds: [embed] });
}