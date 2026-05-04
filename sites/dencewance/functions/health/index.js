// Simple Appwrite Function example: health check
// This file is intended to be uploaded as an Appwrite Function (Node runtime).

console.log(JSON.stringify({
  status: 'ok',
  time: new Date().toISOString(),
  env: {
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT || null,
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID || null,
    APPWRITE_DB_ID: process.env.APPWRITE_DB_ID || null,
  }
}));

// Appwrite captures stdout. Use this file as a template for other functions.
