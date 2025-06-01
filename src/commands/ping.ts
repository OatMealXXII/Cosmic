import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('📡 Shows bot latency');

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: unknown) {
    
    await interaction.deferReply();

    const sent = await interaction.followUp('Pinging...');
    const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    return interaction.editReply({
        embeds: [{
            title: '🛰️ Pong!',
            color: 0x00AE86,
            fields: [
                {
                    name: '📡 Roundtrip Latency',
                    value: `${roundtripLatency}ms`,
                    inline: true
                },
                {
                    name: '🕸️ WebSocket Latency',
                    value: `${wsLatency}ms`,
                    inline: true
                }
            ],
            timestamp: new Date().toISOString()
        }]
    });
}
