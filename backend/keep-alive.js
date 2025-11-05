// keep-alive.js - Ejecutar este script para mantener activo el servidor
const https = require('https');

const PING_URLS = [
  'https://distinct-oralla-takumi-net-0d317399.koyeb.app/health',
  'https://distinct-oralla-takumi-net-0d317399.koyeb.app/healthz'
];

function pingServer() {
  PING_URLS.forEach(url => {
    https.get(url, (res) => {
      console.log(`✅ Ping exitoso a ${url} - Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log(`❌ Error ping a ${url}:`, err.message);
    });
  });
}

// Ping cada 10 minutos
setInterval(pingServer, 10 * 60 * 1000);

// Primer ping inmediato
pingServer();

console.log('🔄 Servicio de keep-alive iniciado...');