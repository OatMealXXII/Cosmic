export default {
    activities: {
        name: '/play เพื่อเล่นเพลง', // ชื่อกิจกรรมที่จะแสดง
        type: 'Streaming', //    Playing = 0 Streaming = 1 Listening = 2 Watching = 3 Custom = 4 Competing = 5
        status: 'online' // online | idle | dnd | invisible
    },

    defaultvolume:{
        volume: 25 // ค่าเริ่มต้นของเสียงเพลง (0-100),
    },
};