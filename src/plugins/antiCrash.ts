import { Client } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import process from 'node:process';

// โครงสร้างสำหรับการตั้งค่า AntiCrash
interface AntiCrashConfig {
    enabled: boolean;         // เปิดใช้งาน antiCrash หรือไม่
    logToFile: boolean;       // บันทึกลงไฟล์หรือไม่
    logToConsole: boolean;    // แสดงใน console หรือไม่
    logToChannel: boolean;    // ส่งแจ้งเตือนไปยังช่อง Discord หรือไม่
    logChannelId?: string;    // ID ของช่องที่จะส่งแจ้งเตือน
    exitOnUncaught: boolean;  // ปิดบอทเมื่อเกิด uncaught exception หรือไม่
    logDirectory: string;     // โฟลเดอร์สำหรับเก็บไฟล์ log
}

// ค่าเริ่มต้น
const defaultConfig: AntiCrashConfig = {
    enabled: true,
    logToFile: true,
    logToConsole: true,
    logToChannel: false,
    exitOnUncaught: false,
    logDirectory: 'logs'
};

/**
 * คลาสสำหรับจัดการการป้องกันการล่มของบอท
 */
export class AntiCrash {
    private client: Client;
    private config: AntiCrashConfig;
    private logFileName: string;

    /**
     * สร้าง instance ของ AntiCrash
     * @param client Client Discord.js
     * @param config ตั้งค่าสำหรับ AntiCrash (optional)
     */
    constructor(client: Client, config: Partial<AntiCrashConfig> = {}) {
        this.client = client;
        this.config = { ...defaultConfig, ...config };
        
        // สร้างชื่อไฟล์ log โดยใช้วันที่และเวลาปัจจุบัน
        const now = new Date();
        this.logFileName = `crash_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.log`;
        
        // สร้างโฟลเดอร์สำหรับเก็บ log หากยังไม่มี
        if (this.config.logToFile) {
            if (!fs.existsSync(this.config.logDirectory)) {
                fs.mkdirSync(this.config.logDirectory, { recursive: true });
            }
        }
    }

    /**
     * เริ่มต้นการใช้งาน AntiCrash
     */
    public start(): void {
        if (!this.config.enabled) return;

        this.logInfo('AntiCrash system initialized');

        // จัดการ uncaught exceptions
        process.on('uncaughtException', (error: Error) => {
            this.handleError('Uncaught Exception', error);

            if (this.config.exitOnUncaught) {
                this.logError('Bot is shutting down due to an uncaught exception');
                process.exit(1);
            }
        });

        // จัดการ unhandled rejection
        process.on('unhandledRejection', (reason: any) => {
            const error = reason instanceof Error ? reason : new Error(String(reason));
            this.handleError('Unhandled Promise Rejection', error);
        });

        // จัดการ warning
        process.on('warning', (warning: Error) => {
            this.handleWarning('Process Warning', warning);
        });

        // จัดการการปิดโปรแกรม
        process.on('SIGINT', () => {
            this.logInfo('Bot received SIGINT signal, shutting down gracefully');
            this.cleanup();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            this.logInfo('Bot received SIGTERM signal, shutting down gracefully');
            this.cleanup();
            process.exit(0);
        });

        // เพิ่มการจัดการข้อผิดพลาดสำหรับ Discord client
        this.client.on('error', (error: Error) => {
            this.handleError('Discord Client Error', error);
        });

        this.client.on('shardError', (error: Error) => {
            this.handleError('Discord Shard Error', error);
        });
    }

    /**
     * จัดการข้อผิดพลาด
     * @param type ประเภทของข้อผิดพลาด
     * @param error ข้อผิดพลาดที่เกิดขึ้น
     */
    private handleError(type: string, error: Error): void {
        const timestamp = new Date().toISOString();
        const message = `[${timestamp}] [ERROR] [${type}] ${error.name}: ${error.message}`;
        const stack = error.stack ? `\nStack Trace:\n${error.stack}` : '';
        
        // แสดงใน console
        if (this.config.logToConsole) {
            console.error('\x1b[31m%s\x1b[0m', message); // สีแดง
            if (stack) console.error('\x1b[31m%s\x1b[0m', stack);
        }
        
        // บันทึกลงไฟล์
        if (this.config.logToFile) {
            const logPath = path.join(this.config.logDirectory, this.logFileName);
            fs.appendFileSync(logPath, `${message}${stack}\n\n`);
        }
        
        // ส่งไปยังช่อง Discord
        if (this.config.logToChannel && this.config.logChannelId) {
            this.sendErrorToChannel(type, error);
        }
    }

    /**
     * จัดการ warning
     * @param type ประเภทของ warning
     * @param warning warning ที่เกิดขึ้น
     */
    private handleWarning(type: string, warning: Error): void {
        const timestamp = new Date().toISOString();
        const message = `[${timestamp}] [WARNING] [${type}] ${warning.name}: ${warning.message}`;
        
        // แสดงใน console
        if (this.config.logToConsole) {
            console.warn('\x1b[33m%s\x1b[0m', message); // สีเหลือง
        }
        
        // บันทึกลงไฟล์
        if (this.config.logToFile) {
            const logPath = path.join(this.config.logDirectory, this.logFileName);
            fs.appendFileSync(logPath, `${message}\n\n`);
        }
    }

    /**
     * บันทึกข้อความ info
     * @param message ข้อความที่ต้องการบันทึก
     */
    private logInfo(message: string): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [INFO] ${message}`;
        
        // แสดงใน console
        if (this.config.logToConsole) {
            console.log('\x1b[36m%s\x1b[0m', formattedMessage); // สีฟ้า
        }
        
        // บันทึกลงไฟล์
        if (this.config.logToFile) {
            const logPath = path.join(this.config.logDirectory, this.logFileName);
            fs.appendFileSync(logPath, `${formattedMessage}\n\n`);
        }
    }

    /**
     * บันทึกข้อความ error
     * @param message ข้อความ error ที่ต้องการบันทึก
     */
    private logError(message: string): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [ERROR] ${message}`;
        
        // แสดงใน console
        if (this.config.logToConsole) {
            console.error('\x1b[31m%s\x1b[0m', formattedMessage); // สีแดง
        }
        
        // บันทึกลงไฟล์
        if (this.config.logToFile) {
            const logPath = path.join(this.config.logDirectory, this.logFileName);
            fs.appendFileSync(logPath, `${formattedMessage}\n\n`);
        }
    }

    /**
     * ส่งข้อผิดพลาดไปยังช่อง Discord
     * @param type ประเภทของข้อผิดพลาด
     * @param error ข้อผิดพลาดที่เกิดขึ้น
     */
    private async sendErrorToChannel(type: string, error: Error): Promise<void> {
        if (!this.config.logChannelId) return;
        
        try {
            const channel = await this.client.channels.fetch(this.config.logChannelId);
            if (
                !channel ||
                !channel.isTextBased() ||
                typeof (channel as any).send !== 'function'
            ) return;
            
            // ตัดข้อความหากยาวเกินไป
            let stackTrace = error.stack || 'No stack trace available';
            if (stackTrace.length > 1500) {
                stackTrace = stackTrace.substring(0, 1500) + '... (truncated)';
            }
            
            const errorMessage = `**🔴 ${type} Detected**\n\`\`\`\n${error.name}: ${error.message}\n\n${stackTrace}\n\`\`\``;
            await (channel as any).send(errorMessage);
        } catch (channelError) {
            console.error('Failed to send error to Discord channel:', channelError);
        }
    }

    /**
     * ทำความสะอาดทรัพยากรต่างๆ ก่อนปิดบอท
     */
    private cleanup(): void {
        this.logInfo('Performing cleanup before shutdown');
        
        // ปิดการเชื่อมต่อของ Discord client
        if (this.client.isReady()) {
            this.client.destroy();
        }
        
        // ทำความสะอาดอื่นๆ ตามต้องการ
        // เช่น ปิดการเชื่อมต่อกับฐานข้อมูล, บันทึกสถานะปัจจุบัน, ฯลฯ
    }
}

/**
 * ฟังก์ชันสำเร็จรูปสำหรับเริ่มต้น AntiCrash
 * @param client Discord client
 * @param antiCrashconfig ตั้งค่า (optional)
 * @returns instance ของ AntiCrash
 */
export function setupAntiCrash(client: Client, config: Partial<AntiCrashConfig> = {}): AntiCrash {
    const antiCrash = new AntiCrash(client, config);
    antiCrash.start();
    return antiCrash;
}

// Created By Claude 3.7 OatMealXXII