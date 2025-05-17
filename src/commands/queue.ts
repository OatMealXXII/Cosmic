import { Shoukaku } from "shoukaku";
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

type Track = {
    encoded: string;
    info: {
        title: string;
        uri: string;
        author: string;
        length: number;
    };
};

export const queueMap = new Map<string, Track[]>();

export const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('แสดงคิวเพลงที่กำลังเล่นอยู่')

const SONGS_PER_PAGE = 10;

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    const queue = queueMap.get(interaction.guildId!) ?? [];
    const guild = interaction.guildId;
    const player = shoukaku.players.get(guild!)

    if (!queue.length) {
        return interaction.reply('📭 คิวว่างเปล่า');
    }

    const currentTrack = (player as any).currentTrack;
    const pages = Math.ceil(queue.length / SONGS_PER_PAGE);
    let currentPage = 0;

    function createQueueEmbed(page: number) {
        const start = page * SONGS_PER_PAGE;
        const end = Math.min(start + SONGS_PER_PAGE, queue.length);
        const pageQueue = queue.slice(start, end);

        const description = pageQueue
            .map((track, i) => `${start + i + 1}. ${track.info.title} - ${track.info.author}`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎶 คิวเพลง')
            .setDescription(description)
            .addFields(
                { 
                    name: '🎵 กำลังเล่น', 
                    value: `${currentTrack.info.title} - ${currentTrack.info.author}`,
                    inline: false 
                },
                { 
                    name: '📊 สถานะคิว', 
                    value: `หน้า ${page + 1}/${pages}\nเพลงทั้งหมด: ${queue.length} เพลง`, 
                    inline: true 
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Cosmic - OatMealXXII' });

        return embed;
    }

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prev_page')
                .setLabel('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('next_page')
                .setLabel('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pages <= 1)
        );

    const initialMessage = await interaction.reply({
        embeds: [createQueueEmbed(0)],
        components: pages > 1 ? [row] : []
    });

    if (pages > 1) {
        const collector = initialMessage.createMessageComponentCollector({ 
            time: 60000 // 1 minute timeout
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ 
                    content: '⚠️ คุณไม่สามารถใช้ปุ่มนี้ได้', 
                    ephemeral: true 
                });
                return;
            }

            if (i.customId === 'prev_page' && currentPage > 0) {
                currentPage--;
            } else if (i.customId === 'next_page' && currentPage < pages - 1) {
                currentPage++;
            }

            const newRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === pages - 1)
                );

            await i.update({
                embeds: [createQueueEmbed(currentPage)],
                components: [newRow]
            });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );

            interaction.editReply({
                components: [disabledRow]
            }).catch(console.error);
        });
    }
}