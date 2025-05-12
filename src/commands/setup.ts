import { PermissionsBitField, ChatInputCommandInteraction, ChannelType, SlashCommandBuilder } from "discord.js";
import { Shoukaku } from "shoukaku";

export const musicRoomMap = new Map<string, string>();

export const data = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('สร้างห้องเล่นเพลง');

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const guild = interaction.guild!;
    const existing = guild.channels.cache.find(c => c.name === "🎵・Cosmic" && c.type === ChannelType.GuildText);

    if (existing) {
        musicRoomMap.set(guild.id, existing.id);
        return interaction.reply({ content: '❗ มีห้องสั่งเพลงอยู่แล้ว', ephemeral: true });
    }

    const channel = await guild.channels.create({
        name: '🎵・Cosmic',
        type: ChannelType.GuildText,
        topic: 'ห้องเอาไว้สั่งเพลงใช้กับบอท Cosmic',
        permissionOverwrites: [
            {
                id: guild.roles.everyone,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                ]
            }
        ]
    });

    musicRoomMap.set(guild.id, channel.id);
    interaction.reply({ content: '✅ สร้างห้องสั่งเพลงเรียบร้อยแล้ว', ephemeral: true });
}
