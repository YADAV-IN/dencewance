import 'dotenv/config';
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.replace(/\\n/g, '')?.trim() || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.replace(/\\n/g, '')?.trim() || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.replace(/\\n/g, '')?.trim() || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME?.replace(/\\n/g, '')?.trim() || '';

if (!R2_ACCOUNT_ID) {
  console.error("Missing R2_ACCOUNT_ID");
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const corsCommand = new PutBucketCorsCommand({
  Bucket: R2_BUCKET_NAME,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedOrigins: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      },
    ],
  },
});

s3Client.send(corsCommand)
  .then(() => console.log('CORS configured successfully!'))
  .catch(err => console.error('Error setting CORS:', err));
