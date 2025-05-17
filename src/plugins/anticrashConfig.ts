const antiCrashconfig = {
    enabled: true,        // เปิดใช้งาน antiCrash
    logToFile: true,      // บันทึกลงไฟล์
    logToConsole: true,   // แสดงใน console
    logToChannel: false,  // ส่งแจ้งเตือนไปยังช่อง Discord
    logChannelId: '1319946779847954443',     // ID ของช่องที่จะส่งแจ้งเตือน
    exitOnUncaught: false, // ไม่ปิดบอทเมื่อเกิดข้อผิดพลาดร้ายแรง
    logDirectory: 'logs'  // โฟลเดอร์สำหรับเก็บไฟล์ log
};