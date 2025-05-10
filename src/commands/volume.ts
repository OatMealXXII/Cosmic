import { Player, Shoukaku } from "shoukaku";
import { ChatInputCommandInteraction, EmbedBuilder, Guild, SlashCommandBuilder } from "discord.js";
import { playerChannelMap } from "../maps/playerChannelMap.ts";

export const data = new SlashCommandBuilder()
    .setName('volume')
    .setDescription('ปรับระดับเสียงของบอท 1 - 100')
    .addNumberOption(option =>
        option.setName('number').setDescription('ระดับเสียงใน 1 - 100').setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
    );

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const volume = interaction.options.getNumber('number') ?? 100;
    const guildId = interaction.guildId!;
    const player = shoukaku.players.get(guildId)

    if (!player || !player.node) {
        return await interaction.reply({
            content: '❌ ไม่มีเพลงที่กำลังเล่นอยู่ หรือบอทไม่ได้อยู่ในช่องเสียง',
            ephemeral: true
        });
    }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const botVcId = playerChannelMap.get(interaction.guildId!);
    if (!botVcId || member!.voice.channel?.id !== botVcId) {
        return interaction.reply({ content: '❌ คุณต้องอยู่ในห้องเดียวกับบอท!', ephemeral: true });
    }

    await player.setGlobalVolume(volume);
    await interaction.reply({ content: `🔊 ตั้งค่าระดับเสียงเป็น **${volume}%** แล้ว`, ephemeral: true });
}
