import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Shoukaku } from 'shoukaku';

export const data = new SlashCommandBuilder()
    .setName('node')
    .setDescription('แสดงสถานะของเซิร์ฟเวอร์ Lavalink');

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const node = shoukaku.options.nodeResolver(shoukaku.nodes);
    if (!node || !node.stats) {
        return await interaction.reply({
            content: '❌ ไม่พบ Node หรือบอทยังไม่ได้เชื่อมต่อกับ Lavalink',
            ephemeral: true
        });
    }

    const stats = node.stats;

    const embed = new EmbedBuilder()
        .setTitle('📡 Lavalink Node Info')
        .addFields(
            { name: 'ผู้ใช้งาน Voice', value: `${stats.players}`, inline: true },
            { name: 'กำลังเล่นอยู่', value: `${stats.playingPlayers}`, inline: true },
            { name: 'RAM ใช้ไป', value: `${(stats.memory.used / 1024 / 1024).toFixed(2)} MB`, inline: true },
            { name: 'RAM ทั้งหมด', value: `${(stats.memory.reservable / 1024 / 1024).toFixed(2)} MB`, inline: true },
            { name: 'CPU Load', value: `${(stats.cpu.systemLoad * 100).toFixed(2)}%`, inline: true },
            { name: 'Uptime', value: `${Math.floor(stats.uptime / 1000)} วินาที`, inline: true }
        )
        .setColor('#00bfff')
        .setTimestamp()
        .setFooter({ text: 'Cosmic - OatMealXXII' });

    return await interaction.reply({ embeds: [embed], ephemeral: true });
}