import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push } from 'firebase/database';
import config from './firebaseConfig.json' assert { type: "json" };

const app = initializeApp(config);
const database = getDatabase(app);
const playerHistoryRef = ref(database, 'playerHistory');

const saveStats = async () => {
    try {
        const res = await fetch('https://api.mcsrvstat.us/2/play.flancraft.com');
        const data = await res.json();
        const playersOnline = data.players ? data.players.online : 0;
        const entry = {
            timestamp: Date.now(),
            value: playersOnline
        };
        await push(playerHistoryRef, entry);
        console.log(`[${new Date().toISOString()}] Players: ${playersOnline}`);
    } catch (err) {
        console.error('❌ Error:', err);
    }
};

console.log('📈 Iniciando monitor de stats de Flancraft...');
saveStats();
setInterval(saveStats, 60000);
