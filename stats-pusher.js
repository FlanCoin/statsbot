const fetch = require('node-fetch');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, set, get } = require('firebase/database');
const config = require('./firebaseConfig.json');

// Inicializar Firebase
const app = initializeApp(config);
const database = getDatabase(app);
const playerHistoryRef = ref(database, 'playerHistory');
const summaryRef = ref(database, 'dailySummary');

// Día actual para controlar si ha cambiado
let lastDate = new Date().toISOString().split('T')[0];

// Función principal que corre cada minuto
const saveStats = async () => {
  try {
    // Llamada a la API
    const res = await fetch('https://api.mcsrvstat.us/2/play.flancraft.com');
    const data = await res.json();
    const playersOnline = data.players ? data.players.online : 0;

    const now = new Date();
    const timestamp = now.getTime();
    const currentDate = now.toISOString().split('T')[0];

    const newEntry = { timestamp, value: playersOnline };
    await push(playerHistoryRef, newEntry);
    console.log(`[${now.toISOString()}] Players: ${playersOnline}`);

    // Verifica si ha cambiado el día
    if (currentDate !== lastDate) {
      await generateDailySummary(lastDate);
      lastDate = currentDate;
    }

  } catch (err) {
    console.error('❌ Error al guardar los stats:', err);
  }
};

// Función para generar resumen de un día completo
const generateDailySummary = async (dateStr) => {
  try {
    const snapshot = await get(playerHistoryRef);
    const allData = snapshot.val();

    if (!allData) return;

    // Filtrar solo las entradas del día indicado
    const entries = Object.values(allData).filter((entry) => {
      const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
      return entryDate === dateStr;
    });

    if (entries.length === 0) return;

    const values = entries.map(e => e.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = Math.round(total / values.length);
    const max = Math.max(...values);

    await set(ref(database, `dailySummary/${dateStr}`), {
      average: avg,
      max: max
    });

    console.log(`📊 Resumen guardado para ${dateStr} ➤ Media: ${avg}, Pico: ${max}`);
  } catch (error) {
    console.error(`⚠️ Error generando resumen de ${dateStr}:`, error);
  }
};

// Iniciar loop
console.log('📈 Iniciando monitor de stats de Flancraft...');
saveStats();
setInterval(saveStats, 60000); // cada minuto
