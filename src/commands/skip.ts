import { Shoukaku } from "shoukaku";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import config from "../config/config.ts";
import { queueMap } from "./queue.ts";

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
    .setName('skip')
    .setDescription('ข้ามเพลงปัจจุบันไปยังเพลงต่อไปในคิว');

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const guildId = interaction.guildId!;
    const player = shoukaku.players.get(guildId);

    if (!player) {
        return await interaction.reply({ content: '❌ ยังไม่มีการเล่นเพลงในเซิร์ฟเวอร์นี้', ephemeral: true });
    }

    const queue = queueMap.get(guildId) ?? [];

    const nextTrack = queue.shift();
    if (!nextTrack) {
        await player.stopTrack();
        queueMap.delete(guildId);
        return await interaction.reply('❌ ไม่มีเพลงถัดไปในคิวแล้ว');
    }

    await player.playTrack({ track: { encoded: nextTrack.encoded } });
    player.volume = config.defaultvolume.volume;

    const embed = new EmbedBuilder()
        .setColor('#00cc99')
        .setTitle('⏭️ ข้ามเพลงแล้ว')
        .setDescription(`กำลังเล่น: **${nextTrack.info.title}**`)
        .addFields(
            { name: 'ศิลปิน', value: nextTrack.info.author, inline: true },
            { name: 'ความยาว', value: `${(nextTrack.info.length / 1000 / 60).toFixed(2)} นาที`, inline: true }
        )
        .setURL(nextTrack.info.uri)
        .setTimestamp()
        .setFooter({ text: 'Cosmic - OatMealXXII' });

    return await interaction.reply({ embeds: [embed] });
}
