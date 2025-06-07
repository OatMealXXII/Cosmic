import { ChatInputCommandInteraction, SlashCommandBuilder, Collection, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { Shoukaku } from 'shoukaku';

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, any>;
        effects: Collection<string, any>;
    }
}

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('⚒️ แสดงคำสั่งของบอท')

export async function execute(interaction: ChatInputCommandInteraction, shoukaku: Shoukaku) {
    try {
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

        const effects = interaction.client.effects.map(effects => ({
            name: effects.data.name,
            description: effects.data.description || 'ไม่มีคำอธิบาย'
        }));

        const itemsPerPage = 10;
        const commandsPages = Math.ceil(commands.length / itemsPerPage);
        const effectsPages = Math.ceil(effects.length / itemsPerPage);
        let currentPage = 0;

        const generateEmbed = (commandsPages: number, effectsPages:number) => {
            const commandStart = commandsPages * itemsPerPage;
            const effectStart = effectsPages * itemsPerPage;
            const end1 = commandStart + itemsPerPage;
            const end2 = effectStart + itemsPerPage;
            const currentCommands1 = commands.slice(commandStart, end1);
            const currentCommands2 = commands.slice(effectStart, end2);

            const helpEmbed = new EmbedBuilder()
                .setTitle('⚒️ คำสั่งทั้งหมด')
                .setColor(0x00AE86)
                .setTimestamp()
                .setFooter({
                    text: `หน้า ${commandsPages + 1}/${commandsPages} • มีคำสั่งทั้งหมด ${commands.length} คำสั่ง`
                });

            const effectsEmbed = new EmbedBuilder()
                .setTitle('🎛️ เอฟเฟคทั้งหมด')
                .setColor(0x00AE86)
                .setTimestamp()
                .setFooter({
                    text: `หน้า ${commandsPages + 1}/${commandsPages} • มีเอฟเฟคทั้งหมด ${effects.length} คำสั่ง`
                });

            currentCommands1.forEach(cmd => {
                helpEmbed.addFields({
                    name: `/${cmd.name}`,
                    value: cmd.description,
                    inline: true
                });
            });

            effects.forEach(effect => {
                effectsEmbed.addFields({
                    name: `${effect.name}`,
                    value: effect.description,
                    inline: true
                });
            });

            return [helpEmbed, effectsEmbed];
        }

        const prevButton = new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀️ ก่อนหน้า')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        const nextButton = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('▶️ ถัดไป')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(prevButton, nextButton);

        const response = await interaction.reply({
            embeds: generateEmbed(currentPage, currentPage),
            components: [row],
        });

        const collector = response.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ คุณไม่สามารถใช้ปุ่มนี้ได้', ephemeral: true });
            }

            if (i.customId === 'prev' && currentPage > 0) {
                currentPage--;
            } else if (i.customId === 'next' && currentPage < Math.max(commandsPages, effectsPages) - 1) {
                currentPage++;
            }

            prevButton.setDisabled(currentPage === 0);
            nextButton.setDisabled(currentPage === Math.max(commandsPages, effectsPages) - 1);

            await i.update({
                embeds: generateEmbed(currentPage, currentPage),
                components: [new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton)]
            });
        });

        collector.on('end', () => {
            prevButton.setDisabled(true);
            nextButton.setDisabled(true);
            interaction.editReply({
                components: [new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton)]
            }).catch(() => { });
        });

    } catch (error) {
        console.error('Error in help command:', error);
        return interaction.reply({
            content: '❌ เกิดข้อผิดพลาดในการแสดงคำสั่ง',
            ephemeral: true
        });
    }
}