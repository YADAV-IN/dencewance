import 'dotenv/config';
import { generatePresignedUrl, s3Client } from './src/r2.js';

async function test() {
  try {
    const { uploadUrl } = await generatePresignedUrl('test-cors.mp4', 'video/mp4');
    console.log("Upload URL:", uploadUrl);
    
    // Simulate Browser OPTIONS request
    const optionsRes = await fetch(uploadUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    
    console.log("CORS OPTIONS status:", optionsRes.status, optionsRes.statusText);
    const text = await optionsRes.text();
    console.log("CORS OPTIONS response:", text);
  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
