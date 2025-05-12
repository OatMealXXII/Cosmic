import { Client, GatewayIntentBits, REST, Routes, ActivityType, PresenceUpdateStatus, ChatInputCommandInteraction, Events } from 'discord.js';
import { Shoukaku, Connectors } from 'shoukaku';
import path from 'path';
import { fileURLToPath } from 'url';
import { configDotenv } from 'dotenv';
import Nodes from './config/node.ts';
import { registerCommands } from './handlers/commandRegister.ts';
import { handleInteraction } from './handlers/interactionHandler.ts';
import { keepAlive } from './plugins/KeepAlive.ts';
import config from './config/config.ts';
import handleVoiceStateUpdate from './interactions/interactionCreate.ts';
import { musicRoomMap } from './commands/setup.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
configDotenv({ path: path.resolve(__dirname, '../.env') });

interface Nodes {
    identifier: string;
    host: string;
    port: number;
    auth: string;
    secure: boolean;
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);

// Add error handling for Shoukaku
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
    console.log(`${client.user?.tag} is ready.`);
    await registerCommands(client);

    client.user!.setPresence({
        status: config.activities.status as 'online' | 'idle' | 'dnd' | 'invisible',
        activities: [
            {
                name: '/play เพื่อเล่นเพลง เอ๊ะส่องอีกแล้วน้าาาา ❤️',
                type: ActivityType.Listening
            }
        ],
    });
});

client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    handleInteraction(interaction, shoukaku);

    client.user?.setActivity(config.activities.name, { type: ActivityType[config.activities.type as keyof typeof ActivityType] });
});

handleVoiceStateUpdate(client, shoukaku);
keepAlive();

client.login(process.env.TOKEN);
