import { s3Client, generatePresignedUrl } from './server/src/r2.js';
import fetch from 'node-fetch';

async function test() {
  try {
    const { uploadUrl, publicUrl } = await generatePresignedUrl('test-405-upload.txt', 'text/plain');
    console.log("Got upload URL:", uploadUrl);
    
    // Now try to PUT a small text file
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Hello R2!'
    });
    
    console.log("Upload response status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Upload response body:", text);
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}
test();
