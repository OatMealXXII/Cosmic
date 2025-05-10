import { Player, Shoukaku } from "shoukaku";
import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, Guild, SlashCommandBuilder } from "discord.js";
import { playerChannelMap } from "../maps/playerChannelMap.ts";

export const data = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('สร้างห้องสั่งเพลง')

export const musicRoomMap = new Map<string, string>();

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const guildId = interaction.guild!;
    const guild = interaction.guild!;

    const existing = guildId.channels.cache.find(c => c.name === "🎵・Cosmic" && c.type === ChannelType.GuildText);
    if (!existing) {
        await guildId.channels.create({
            name: '🎵・Cosmic',
            type: ChannelType.GuildText,
            topic: 'ห้องเอาไว้สั่งเพลงใช้กับบอท Cosmic',
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                }
            ]
        });
    }

}