import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../../data/stats.json');

export function getStats() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({
      users: 0,
      songsPlayed: 0,
      lastSong: "No song played"
    }, null, 2));
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export function updateStats(partial: Partial<{ users: number; songsPlayed: number; lastSong: string; }>, title: string) {
  const current = getStats();
  const updated = { ...current, ...partial };
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
}
