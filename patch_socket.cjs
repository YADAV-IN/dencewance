const fs = require('fs');
let code = fs.readFileSync('server/src/index.js', 'utf8');

// Add imports
code = code.replace(/import express from 'express';/, "import express from 'express';\nimport http from 'http';\nimport { Server } from 'socket.io';");

// Create server and io
code = code.replace(/const app = express\(\);/, "const app = express();\nexport const server = http.createServer(app);\nexport const io = new Server(server, { cors: { origin: '*' } });\n\nio.on('connection', (socket) => { console.log('Client connected:', socket.id); });");

// Emit events
// After creating status
code = code.replace(/res\.status\(201\)\.json\(\{.*?message: 'Status created'.*?status: newStatus.*?\}\);/s, 
  "io.emit('realtime_update', { type: 'status' });\n$&");

// After creating reel
code = code.replace(/res\.json\(\{.*?success: true.*?data: newReel.*?\}\);/s,
  "io.emit('realtime_update', { type: 'reel' });\n$&");

// After deleting anything
code = code.replace(/res\.json\(\{ success: true, message: 'Deleted (Appwrite\+DB)' \}\);/s,
  "io.emit('realtime_update', { type: 'delete' });\n$&");

// Change listen
code = code.replace(/app\.listen\(PORT, \(\) =>/g, "server.listen(PORT, () =>");

fs.writeFileSync('server/src/index.js', code);
