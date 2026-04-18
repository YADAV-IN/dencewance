// Simple keep-alive script for Appwrite backend
// Pings your backend every 10 minutes to prevent sleep/idle

const https = require('https');

const URL = 'https://nyc.cloud.appwrite.io/v1'; // Appwrite endpoint (from your config)
const HEALTH_URL = 'https://nyc.cloud.appwrite.io/v1'; // You can also use your deployed backend's /api/health if public

function ping() {
  https.get(HEALTH_URL, (res) => {
    console.log(`[${new Date().toLocaleString()}] Pinged Appwrite: Status ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`[${new Date().toLocaleString()}] Ping error:`, e.message);
  });
}

// Ping every 10 minutes
setInterval(ping, 10 * 60 * 1000);

// Initial ping
ping();
