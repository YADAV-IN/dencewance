import 'dotenv/config';
import { generatePresignedUrl } from './src/r2.js';

async function test() {
  try {
    const { uploadUrl, publicUrl } = await generatePresignedUrl('test-405-upload.txt', 'text/plain');
    console.log("URL generated. Length:", uploadUrl.length);
    
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Hello R2!'
    });
    
    console.log("Upload status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Response:", text);
    
  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
