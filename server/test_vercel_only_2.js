import dotenv from 'dotenv';
dotenv.config({ path: '.env.server-prod' });
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim() || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.trim() || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim() || '';

console.log({
  hasR2Config: !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME),
  trimmed_id: R2_ACCOUNT_ID,
  raw_id: process.env.R2_ACCOUNT_ID
});
