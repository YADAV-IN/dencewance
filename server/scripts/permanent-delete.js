#!/usr/bin/env node
/**
 * PERMANENT DELETE SCRIPT - Delete data from:
 * - Appwrite Database
 * - Appwrite Storage
 * - R2 (Cloudflare)
 * - MongoDB (local)
 * - Cache
 */

import 'dotenv/config';
import { Databases, Storage, Client } from 'node-appwrite';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { initDb, Reel, ReelComment, SavedReel } from '../src/db.js';
import readline from 'readline';

// ===================== CONFIG =====================
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DB_ID = process.env.APPWRITE_DB_ID || '69d60fe8000c9bd92750';
const APPWRITE_BUCKET_ID = process.env.APPWRITE_BUCKET_ID || 'alok_media';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim() || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.trim() || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim() || '';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.trim() || '';

// ===================== SETUP CLIENTS =====================
const appwriteClient = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const appwriteDB = new Databases(appwriteClient);
const appwriteStorage = new Storage(appwriteClient);

const hasR2Config = !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
const s3Client = hasR2Config ? new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
}) : null;

// ===================== HELPERS =====================
const log = (msg, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '✓',
    warn: '⚠',
    error: '✗',
    success: '✓✓',
  }[type] || '•';
  console.log(`[${timestamp}] ${prefix} ${msg}`);
};

const prompt = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

// ===================== DELETION FUNCTIONS =====================

// 1. Delete from Appwrite DB
const deleteFromAppwriteDB = async (docId, collectionId = 'reels') => {
  try {
    await appwriteDB.deleteDocument(APPWRITE_DB_ID, collectionId, docId);
    log(`Deleted from Appwrite DB: ${collectionId}/${docId}`, 'success');
    return true;
  } catch (error) {
    log(`Failed to delete from Appwrite DB (${collectionId}/${docId}): ${error.message}`, 'error');
    return false;
  }
};

// 2. Delete all files from Appwrite Storage
const deleteAllFromAppwriteStorage = async () => {
  try {
    const files = await appwriteStorage.listFiles(APPWRITE_BUCKET_ID);
    if (files.total === 0) {
      log('No files in Appwrite Storage', 'info');
      return 0;
    }

    let deleted = 0;
    for (const file of files.files) {
      try {
        await appwriteStorage.deleteFile(APPWRITE_BUCKET_ID, file.$id);
        deleted++;
        log(`Deleted from Appwrite Storage: ${file.name}`, 'success');
      } catch (e) {
        log(`Failed to delete file ${file.$id} from Appwrite Storage: ${e.message}`, 'warn');
      }
    }
    return deleted;
  } catch (error) {
    log(`Failed to list/delete from Appwrite Storage: ${error.message}`, 'error');
    return 0;
  }
};

// 3. Delete file by ID from Appwrite Storage
const deleteFromAppwriteStorage = async (fileId) => {
  try {
    await appwriteStorage.deleteFile(APPWRITE_BUCKET_ID, fileId);
    log(`Deleted from Appwrite Storage: ${fileId}`, 'success');
    return true;
  } catch (error) {
    log(`Failed to delete ${fileId} from Appwrite Storage: ${error.message}`, 'error');
    return false;
  }
};

// 4. Delete all from R2
const deleteAllFromR2 = async () => {
  if (!hasR2Config) {
    log('R2 not configured', 'warn');
    return 0;
  }

  try {
    const command = new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME });
    const data = await s3Client.send(command);
    
    if (!data.Contents || data.Contents.length === 0) {
      log('No files in R2', 'info');
      return 0;
    }

    let deleted = 0;
    for (const item of data.Contents) {
      try {
        const deleteCmd = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: item.Key,
        });
        await s3Client.send(deleteCmd);
        deleted++;
        log(`Deleted from R2: ${item.Key}`, 'success');
      } catch (e) {
        log(`Failed to delete ${item.Key} from R2: ${e.message}`, 'warn');
      }
    }
    return deleted;
  } catch (error) {
    log(`Failed to list/delete from R2: ${error.message}`, 'error');
    return 0;
  }
};

// 5. Delete file by URL from R2
const deleteFromR2ByUrl = async (url) => {
  if (!hasR2Config) {
    log('R2 not configured', 'warn');
    return false;
  }

  try {
    let key = '';
    
    // Extract key from URL
    if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL)) {
      key = decodeURIComponent(url.slice(R2_PUBLIC_URL.length).replace(/^\/+/, ''));
    } else if (url.includes('.r2.cloudflarestorage.com')) {
      const urlObj = new URL(url);
      key = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''));
    }

    if (!key) {
      log(`Could not extract R2 key from URL: ${url}`, 'warn');
      return false;
    }

    const deleteCmd = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(deleteCmd);
    log(`Deleted from R2: ${key}`, 'success');
    return true;
  } catch (error) {
    log(`Failed to delete from R2 (${url}): ${error.message}`, 'error');
    return false;
  }
};

// 6. Delete from MongoDB
const deleteFromMongoDB = async (reelId) => {
  try {
    await initDb();
    
    // Delete reel
    const reel = await Reel.findByIdAndDelete(reelId);
    if (reel) {
      log(`Deleted from MongoDB Reels: ${reelId}`, 'success');
    }

    // Delete related comments
    const comments = await ReelComment.deleteMany({ reel_id: reelId });
    if (comments.deletedCount > 0) {
      log(`Deleted ${comments.deletedCount} comments from MongoDB`, 'success');
    }

    // Delete saved entries
    const saved = await SavedReel.deleteMany({ reel_id: reelId });
    if (saved.deletedCount > 0) {
      log(`Deleted ${saved.deletedCount} saved entries from MongoDB`, 'success');
    }

    return true;
  } catch (error) {
    log(`Failed to delete from MongoDB: ${error.message}`, 'error');
    return false;
  }
};

// ===================== MAIN OPERATIONS =====================

const deleteSpecificReel = async (reelId) => {
  log(`=== DELETING REEL: ${reelId} ===`, 'info');

  // Get reel details from MongoDB first
  await initDb();
  const reel = await Reel.findById(reelId);
  
  if (!reel) {
    log(`Reel ${reelId} not found in MongoDB`, 'error');
    return;
  }

  log(`Found reel: ${reel.title}`, 'info');

  // Delete storage files
  const urls = [
    reel.video_url,
    reel.cover_image_url,
    reel.file_url,
    reel.fileUrl,
    reel.video_file_url,
    reel.cover_file_url,
  ].filter(Boolean);

  log(`Attempting to delete ${urls.length} files from storage...`, 'info');
  
  for (const url of urls) {
    // Try Appwrite first (if it looks like Appwrite URL)
    if (url.includes('appwrite') || url.includes('blob')) {
      const fileId = url.split('/').pop();
      await deleteFromAppwriteStorage(fileId);
    } else if (url.includes('r2.cloudflarestorage.com') || url.includes(R2_PUBLIC_URL)) {
      await deleteFromR2ByUrl(url);
    }
  }

  // Delete from Appwrite DB
  await deleteFromAppwriteDB(reelId, 'reels');

  // Delete from MongoDB (including related records)
  await deleteFromMongoDB(reelId);

  log(`=== REEL ${reelId} PERMANENTLY DELETED ===`, 'success');
};

const deleteAllReels = async () => {
  const confirm = await prompt('\n⚠️  WARNING: This will delete ALL reels from everywhere!\nType "yes-delete-all" to confirm: ');
  
  if (confirm !== 'yes-delete-all') {
    log('Aborted', 'warn');
    return;
  }

  log(`=== DELETING ALL REELS ===`, 'info');

  await initDb();
  const reels = await Reel.find();
  
  log(`Found ${reels.length} reels to delete`, 'info');

  for (const reel of reels) {
    await deleteSpecificReel(reel._id.toString());
  }

  log(`=== ALL REELS DELETED ===`, 'success');
};

const deleteAllStorage = async () => {
  const confirm = await prompt('\n⚠️  WARNING: This will delete ALL files from Appwrite Storage and R2!\nType "yes-delete-storage" to confirm: ');
  
  if (confirm !== 'yes-delete-storage') {
    log('Aborted', 'warn');
    return;
  }

  log(`=== DELETING ALL STORAGE ===`, 'info');

  const appwriteDeleted = await deleteAllFromAppwriteStorage();
  log(`Deleted ${appwriteDeleted} files from Appwrite Storage`, 'success');

  const r2Deleted = await deleteAllFromR2();
  log(`Deleted ${r2Deleted} files from R2`, 'success');

  log(`=== STORAGE CLEANUP COMPLETE ===`, 'success');
};

const showStatus = async () => {
  log(`=== SYSTEM STATUS ===`, 'info');

  try {
    // Appwrite DB
    log('Checking Appwrite Database...', 'info');
    const collections = ['reels', 'pyq', 'news'];
    for (const col of collections) {
      try {
        const docs = await appwriteDB.listDocuments(APPWRITE_DB_ID, col);
        log(`  ${col}: ${docs.total} documents`, 'info');
      } catch (e) {
        log(`  ${col}: Error - ${e.message}`, 'warn');
      }
    }

    // Appwrite Storage
    log('Checking Appwrite Storage...', 'info');
    try {
      const files = await appwriteStorage.listFiles(APPWRITE_BUCKET_ID);
      log(`  Total files: ${files.total}`, 'info');
    } catch (e) {
      log(`  Error: ${e.message}`, 'warn');
    }

    // R2
    if (hasR2Config) {
      log('Checking R2...', 'info');
      try {
        const cmd = new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME });
        const data = await s3Client.send(cmd);
        log(`  Total files: ${data.Contents?.length || 0}`, 'info');
      } catch (e) {
        log(`  Error: ${e.message}`, 'warn');
      }
    } else {
      log('R2 not configured', 'warn');
    }

    // MongoDB
    log('Checking MongoDB...', 'info');
    await initDb();
    const reelCount = await Reel.countDocuments();
    const commentCount = await ReelComment.countDocuments();
    const savedCount = await SavedReel.countDocuments();
    log(`  Reels: ${reelCount}`, 'info');
    log(`  Comments: ${commentCount}`, 'info');
    log(`  Saved: ${savedCount}`, 'info');
  } catch (error) {
    log(`Status check error: ${error.message}`, 'error');
  }

  log(`=== STATUS COMPLETE ===`, 'success');
};

// ===================== CLI INTERFACE =====================
const showMenu = async () => {
  console.log(`
╔════════════════════════════════════════╗
║   PERMANENT DELETE UTILITY              ║
║   Appwrite + R2 + MongoDB               ║
╚════════════════════════════════════════╝

1. Delete specific reel (by ID)
2. Delete ALL reels (everywhere)
3. Delete ALL storage files (Appwrite + R2)
4. Show system status
5. Exit
  `);
  
  const choice = await prompt('Select option (1-5): ');
  
  switch (choice) {
    case '1':
      const reelId = await prompt('Enter reel ID: ');
      await deleteSpecificReel(reelId);
      break;
    case '2':
      await deleteAllReels();
      break;
    case '3':
      await deleteAllStorage();
      break;
    case '4':
      await showStatus();
      break;
    case '5':
      log('Exiting...', 'info');
      process.exit(0);
    default:
      log('Invalid option', 'error');
  }

  const another = await prompt('\nContinue? (y/n): ');
  if (another.toLowerCase() === 'y') {
    showMenu();
  } else {
    log('Exiting...', 'info');
    process.exit(0);
  }
};

// ===================== START =====================
(async () => {
  try {
    log('PERMANENT DELETE UTILITY STARTED', 'info');
    log(`Appwrite: ${APPWRITE_ENDPOINT}`, 'info');
    log(`R2 Configured: ${hasR2Config}`, 'info');
    
    await showMenu();
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
})();
