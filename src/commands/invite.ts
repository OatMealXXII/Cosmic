import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { config } from 'dotenv';
import configs from '../config/config.ts';

export const data = new SlashCommandBuilder()
    .setName('invite')
    .setDescription('เชิญบอทไปยังเซิร์ฟเวอร์ของคุณ 🏁');

export async function execute(interaction: ChatInputCommandInteraction) {
    return interaction.reply({
        content: `เชิญบอทไปยังเซิร์ฟเวอร์ของคุณได้ที่นี่: [invite](${configs.links.invite})`,
        ephemeral: true
    })
}
