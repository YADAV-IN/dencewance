import dotenv from 'dotenv';
dotenv.config({ path: '.env.server-prod' }); // without the dotenv/config import!
import { hasR2Config } from './src/r2.js';
console.log({ hasR2Config, id: process.env.R2_ACCOUNT_ID });
