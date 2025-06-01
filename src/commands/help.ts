import { ChatInputCommandInteraction, SlashCommandBuilder, Collection, EmbedBuilder } from 'discord.js';
import { Shoukaku } from 'shoukaku';

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, any>;
    }
}

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('⚒️ แสดงคำสั่งของบอท')

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    try {
        console.log('Commands collection size:', interaction.client.commands?.size);

        if (!interaction.client.commands || interaction.client.commands.size === 0) {
            return interaction.reply({
                content: '❌ ไม่พบคำสั่งใดๆ ในบอท',
                ephemeral: true
            });
        }

        const commands = interaction.client.commands.map(command => ({
            name: command.data.name,
            description: command.data.description || 'ไม่มีคำอธิบาย'
        }));

        const helpEmbed = new EmbedBuilder()
            .setTitle('⚒️ คำสั่งทั้งหมด')
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({
                text: `มีคำสั่งทั้งหมด ${commands.length} คำสั่ง`
            });

        // เพิ่ม fields สำหรับแต่ละคำสั่ง
        commands.forEach(cmd => {
            helpEmbed.addFields({
                name: `/${cmd.name}`,
                value: cmd.description,
                inline: true
            });
        });

        return interaction.reply({
            embeds: [helpEmbed]
        });

    } catch (error) {
        console.error('Error in help command:', error);
        return interaction.reply({
            content: '❌ เกิดข้อผิดพลาดในการแสดงคำสั่ง',
            ephemeral: true
        });
    }
}