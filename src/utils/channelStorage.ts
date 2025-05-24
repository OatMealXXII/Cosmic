import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve('../../data/musicChannels.json');

export function getMusicChannel(guildId: string): string | null {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return data[guildId] || null;
}

export function setMusicChannel(guildId: string, channelId: string) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  data[guildId] = channelId;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function removeMusicChannel(guildId: string) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  delete data[guildId];
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
