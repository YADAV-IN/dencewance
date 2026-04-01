import 'dotenv/config'; // loads .env by default... wait! Let me load the pulled one:
import dotenv from 'dotenv';
dotenv.config({ path: '.env.server-prod' });
import { hasR2Config, s3Client } from './src/r2.js';

console.log({
  hasR2Config,
  id: process.env.R2_ACCOUNT_ID,
  trimmedLength: process.env.R2_ACCOUNT_ID?.trim().length,
  rawLength: process.env.R2_ACCOUNT_ID?.length
});
