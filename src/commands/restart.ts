import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Shoukaku } from "shoukaku";
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { config as configDotenv } from 'dotenv';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
configDotenv({ path: path.resolve(__dirname, '../.env') });

export const data = new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Restart bot systems');

export async function execute(shoukaku: Shoukaku, interaction: ChatInputCommandInteraction) {
    if (!interaction.member) {
        return interaction.reply({
            content: '❌ This command can only be used in a server!',
            ephemeral: true
        });
    }

    if (!(interaction.member as GuildMember).permissions.has(PermissionFlagsBits.Administrator) &&
        interaction.user.id !== process.env.OWNER_ID || process.env.DEVELOPERS_ID || "") {
        return interaction.reply({
            content: '❌ You need administrator permission!',
            ephemeral: true
        });
    } else {
        await interaction.reply('🔄 Restarting bot systems...');
        Object.keys(require.cache).forEach(key => {
            if (key.includes('/commands/') || key.includes('/events/')) {
                delete require.cache[key];
            }
        })
    };

    await reloadCommands(interaction.client);
    await interaction.editReply('✅ Bot systems restarted successfully!');
}

async function reloadCommands(client: any) {
    client.commands.clear();

    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
    }
}
