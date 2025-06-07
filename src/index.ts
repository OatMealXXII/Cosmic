import { Client, GatewayIntentBits, ActivityType, Collection, Events } from 'discord.js';
import { Shoukaku, Connectors } from 'shoukaku';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { configDotenv } from 'dotenv';
import Nodes from './config/node.ts';
import { registerCommands } from './handlers/commandRegister.ts';
import { handleInteraction } from './handlers/interactionHandler.ts';
import { keepAlive } from './plugins/keepAlive.ts';
import config from './config/config.ts';
import handleVoiceStateUpdate from './interactions/interactionCreate.ts';
import { setupAntiCrash } from './plugins/antiCrash.ts';
import { autocomplete as playAutocomplete } from './commands/play.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
configDotenv({ path: path.resolve(__dirname, '../.env') });

interface Nodes {
    identifier: string;
    host: string;
    port: number;
}
interface CustomClient extends Client {
    shoukaku?: Shoukaku;
}

const client: CustomClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

setupAntiCrash(client, {
    logToChannel: true,                   // Open send error logs to channel Discord
    logChannelId: '1319946779847954443',  // Logs channel ID (discord channel ID)
    exitOnUncaught: false,                // Not turn off bot on uncaught exception
    logDirectory: 'logs'                  // Local Folder logs
});

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
    try {
        const command = await import(`./commands/${file}`);
        const commandData = command.default || command;

        if (commandData.data?.name) {
            client.commands.set(commandData.data.name, commandData);
            console.log(`✅ Loaded command: ${commandData.data.name}`);
        } else {
            console.warn(`⚠️ Command ${file} missing data or name property`);
        }
    } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error);
    }
}

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);
client.shoukaku = shoukaku;

shoukaku.on('error', (name, error) => {
    console.error(`Shoukaku error on node ${name}:`, error);
});

shoukaku.on('ready', (name) => {
    console.log(`Lavalink Node: ${name} is ready!`);
});

shoukaku.on('disconnect', (name, reason) => {
    console.warn(`Lavalink Node: ${name} disconnected! Reason: ${reason}`);
});

client.once('ready', async () => {
    console.log(`${client.user?.tag} is ready.`, client.shoukaku ? 'Available' : 'Not Available');
    await registerCommands(client);

    client.user!.setPresence({
        status: config.activities.status as 'online' | 'idle' | 'dnd' | 'invisible',
        activities: [
            {
                name: '/play เพื่อเล่นเพลง',
                type: ActivityType.Listening
            }
        ],
    });
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand() || interaction.isButton()) {
            await handleInteraction(interaction, shoukaku);
        }

        if (interaction.isAutocomplete()) {
            if (interaction.commandName === 'play') {
                try {
                    await playAutocomplete(interaction, client.shoukaku);
                } catch (error) {
                    console.error('Autocomplete error:', error);
                    const focusedValue = interaction.options.getFocused();
                    await interaction.respond([
                        { name: `🔍 ค้นหา: ${focusedValue}`, value: focusedValue }
                    ]);
                }
            }
        }
    } catch (error) {
        console.error('Interaction error:', error);
    }

    client.user?.setActivity(config.activities.name, {
        type: ActivityType[config.activities.type as keyof typeof ActivityType]
    });
});

handleVoiceStateUpdate(client, shoukaku);
keepAlive();

client.login(process.env.TOKEN);