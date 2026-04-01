import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';


import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { initDb, Admin, News, Reel, SiteSettings } from './db.js';
import { requireAuth, signToken } from './middleware/auth.js';
import { slugify, ensureUniqueSlug } from './utils/slug.js';
import { getReadingTime } from './utils/readingTime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const IS_VERCEL = process.env.VERCEL === '1';
const readEnv = (name) => process.env[name]?.trim() || '';

import { s3Client, hasR2Config, generatePresignedUrl } from './r2.js';
import multerS3 from 'multer-s3';

const storage = hasR2Config
  ? multerS3({
      s3: s3Client,
      bucket: process.env.R2_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        let folder = 'covers';
        if (file.fieldname === 'avatar') folder = 'avatars';
        else if (file.fieldname === 'media') folder = 'media';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.originalname.split('.').pop() || '';
        cb(null, `alok/${folder}/${uniqueSuffix}.${ext}`);
      }
    })
  : multer.memoryStorage();