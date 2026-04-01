import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim() || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.trim() || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim() || '';
let R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.trim() || '';

if (R2_PUBLIC_URL && R2_PUBLIC_URL.endsWith('/')) {
  R2_PUBLIC_URL = R2_PUBLIC_URL.slice(0, -1);
}

export const hasR2Config = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);

export const s3Client = hasR2Config ? new S3Client({
  region: 'auto',
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
}) : null;

export const generatePresignedUrl = async (key, contentType) => {
  if (!s3Client) throw new Error('R2 not configured');
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
  return { uploadUrl, publicUrl };
};
