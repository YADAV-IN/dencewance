import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  endpoint: `https://71646351db10db7a03b0fe0b2efa0cbe.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: 'b236f0c6ca2901466b4ff69a9b4a6287',
    secretAccessKey: '04f59a3761b7eabfcefdd47632e9635bfc9700a4c1e041431a9492e4854942be',
  },
});

async function run() {
  try {
    const command = new PutObjectCommand({
      Bucket: 'modebook',
      Key: 'test-upload.txt',
      Body: 'Hello World',
      ContentType: 'text/plain',
    });
    console.log('Sending upload to R2...');
    const result = await s3Client.send(command);
    console.log('Success:', result);
  } catch (e) {
    console.error('Failed:', e.message);
    if (e.$metadata) console.error('Status:', e.$metadata.httpStatusCode);
  }
}
run();
