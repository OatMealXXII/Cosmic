import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const xpFilePath = path.join(__dirname, '../../data/xp.json');

interface UserData {
  xp: number;
  level: number;
  lastMessage: number;
}

interface GuildData {
  [userId: string]: UserData;
}

interface XPData {
  [guildId: string]: GuildData;
}

let xpData: XPData = {};

// โหลดข้อมูล XP
function loadXPData() {
  if (fs.existsSync(xpFilePath)) {
    const rawData = fs.readFileSync(xpFilePath, 'utf-8');
    xpData = JSON.parse(rawData);
  } else {
    xpData = {};
  }
}

// บันทึกข้อมูล XP
function saveXPData() {
  fs.writeFileSync(xpFilePath, JSON.stringify(xpData, null, 2));
}

// ตรวจสอบว่า user ได้ XP ได้ไหม (cooldown)
export function canGainXP(userId: string, guildId: string, cooldown: number): boolean {
  const last = xpData[guildId]?.[userId]?.lastMessage ?? 0;
  return Date.now() - last >= cooldown;
}

// เพิ่ม XP และเช็กว่าเลเวลอัพไหม
export function addXP(userId: string, guildId: string, xpAmount: number): { user: UserData, leveledUp: boolean } {
  if (!xpData[guildId]) xpData[guildId] = {};
  if (!xpData[guildId][userId]) {
    xpData[guildId][userId] = {
      xp: 0,
      level: 1,
      lastMessage: 0
    };
  }

  const user = xpData[guildId][userId];
  user.xp += xpAmount;

  const requiredXP = user.level * 50;
  let leveledUp = false;

  while (user.xp >= requiredXP) {
    user.xp -= requiredXP;
    user.level++;
    leveledUp = true;
  }

  saveXPData();
  return { user, leveledUp };
}

// อัปเดตเวลาข้อความล่าสุด
export function updateLastMessage(userId: string, guildId: string) {
  if (!xpData[guildId]) xpData[guildId] = {};
  if (!xpData[guildId][userId]) {
    xpData[guildId][userId] = {
      xp: 0,
      level: 1,
      lastMessage: 0
    };
  }

  xpData[guildId][userId].lastMessage = Date.now();
  saveXPData();
}

// ดึงข้อมูล XP ของผู้ใช้
export function getUserXP(userId: string, guildId: string): UserData | null {
  return xpData[guildId]?.[userId] ?? null;
}

// ดึงข้อมูลทั้งหมดในกิลด์ (สำหรับ leaderboard)
export function getGuildXP(guildId: string): GuildData {
  return xpData[guildId] ?? {};
}

// โหลดตอนเริ่ม
loadXPData();
