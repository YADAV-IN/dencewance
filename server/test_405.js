import 'dotenv/config';
import { generatePresignedUrl, s3Client } from './src/r2.js';

async function test() {
  const { uploadUrl } = await generatePresignedUrl('test-405.mp4', 'video/mp4');
  console.log(uploadUrl);
  const optionsRes = await fetch(uploadUrl, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://alok-website.vercel.app',
      'Access-Control-Request-Method': 'PUT',
      'Access-Control-Request-Headers': 'content-type'
    }
  });
  console.log("OPTIONS status:", optionsRes.status);
  console.log("Allow-Origin:", optionsRes.headers.get('access-control-allow-origin'));
  console.log("Allow-Methods:", optionsRes.headers.get('access-control-allow-methods'));
}
test();
