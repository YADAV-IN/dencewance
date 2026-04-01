import 'dotenv/config';
import { generatePresignedUrl } from './src/r2.js';

async function test() {
  try {
    const { uploadUrl } = await generatePresignedUrl('test-put.mp4', 'video/mp4');
    
    // Simulate Browser actual PUT request
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4' // This was signed
      },
      body: 'test content'
    });
    
    console.log("Upload status:", putRes.status, putRes.statusText);
    const text = await putRes.text();
    console.log("Upload response:", text);

  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
