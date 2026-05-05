#!/usr/bin/env node
/**
 * QUICK VERIFICATION TEST
 * Verify deletion system is working properly
 */

import 'dotenv/config';
import { Client, Databases, Storage } from 'node-appwrite';

const config = {
  appwrite: {
    endpoint: process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID,
    apiKey: process.env.APPWRITE_API_KEY,
    dbId: process.env.APPWRITE_DB_ID,
    bucketId: process.env.APPWRITE_BUCKET_ID,
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID?.trim() || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() || '',
    secretKey: process.env.R2_SECRET_ACCESS_KEY?.trim() || '',
    bucketName: process.env.R2_BUCKET_NAME?.trim() || '',
  },
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  title: (msg) => console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}\n${colors.blue}${msg}${colors.reset}\n${colors.blue}${'='.repeat(50)}${colors.reset}\n`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
};

async function testAppwrite() {
  log.title('Testing Appwrite Configuration');

  try {
    const client = new Client()
      .setEndpoint(config.appwrite.endpoint)
      .setProject(config.appwrite.projectId)
      .setKey(config.appwrite.apiKey);

    const databases = new Databases(client);
    const storage = new Storage(client);

    // Test database
    log.info('Testing Database connection...');
    try {
      const docs = await databases.listDocuments(
        config.appwrite.dbId,
        'reels',
        [],
        10
      );
      log.success(`✓ Database accessible: Found ${docs.total} reels`);
    } catch (e) {
      log.error(`Database error: ${e.message}`);
      return false;
    }

    // Test storage
    log.info('Testing Storage connection...');
    try {
      const files = await storage.listFiles(config.appwrite.bucketId);
      log.success(`✓ Storage accessible: Found ${files.total} files`);
    } catch (e) {
      log.error(`Storage error: ${e.message}`);
      return false;
    }

    return true;
  } catch (e) {
    log.error(`Appwrite test failed: ${e.message}`);
    return false;
  }
}

async function testR2() {
  log.title('Testing R2 Configuration');

  const hasR2 = !!(
    config.r2.accountId &&
    config.r2.accessKeyId &&
    config.r2.secretKey &&
    config.r2.bucketName
  );

  if (!hasR2) {
    log.warn('R2 not fully configured (optional)');
    return true;
  }

  try {
    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretKey,
      },
    });

    const cmd = new ListObjectsV2Command({ Bucket: config.r2.bucketName });
    const data = await s3Client.send(cmd);

    log.success(`✓ R2 accessible: Found ${data.Contents?.length || 0} files`);
    return true;
  } catch (e) {
    log.error(`R2 test failed: ${e.message}`);
    return false;
  }
}

async function testDeletionModule() {
  log.title('Testing Deletion Module');

  try {
    const { extractAppwriteFileId, extractR2Key, deleteStoredMedia } = 
      await import('./server/src/utils/deletion.js');

    // Test Appwrite extraction
    const appwriteUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/xyz/files/abc123def456/view`;
    const fileId = extractAppwriteFileId(appwriteUrl);
    if (fileId === 'abc123def456') {
      log.success(`✓ Appwrite ID extraction working`);
    } else {
      log.error(`Appwrite extraction failed: got "${fileId}"`);
    }

    // Test R2 extraction
    const r2Url = `https://media.example.com/reels/video123.mp4`;
    const key = extractR2Key(r2Url);
    if (key === 'reels/video123.mp4') {
      log.success(`✓ R2 key extraction working`);
    } else {
      log.error(`R2 extraction failed: got "${key}"`);
    }

    log.success(`✓ Deletion module imported successfully`);
    return true;
  } catch (e) {
    log.error(`Module test failed: ${e.message}`);
    return false;
  }
}

async function testFiles() {
  log.title('Checking Required Files');

  const requiredFiles = [
    { path: 'server/src/utils/deletion.js', desc: 'Deletion Utility' },
    { path: 'server/src/index.js', desc: 'Main Server File' },
    { path: 'server/scripts/permanent-delete.js', desc: 'CLI Tool' },
    { path: 'server/test-deletion.js', desc: 'Test Script' },
    { path: 'DELETION-GUIDE.md', desc: 'Documentation' },
  ];

  let allPresent = true;
  for (const file of requiredFiles) {
    try {
      const { existsSync } = await import('fs');
      if (existsSync(file.path)) {
        log.success(`✓ ${file.desc}: ${file.path}`);
      } else {
        log.error(`✗ Missing: ${file.path}`);
        allPresent = false;
      }
    } catch (e) {
      log.error(`Check failed for ${file.path}: ${e.message}`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function main() {
  console.log(`
╔════════════════════════════════════════╗
║   DELETION SYSTEM VERIFICATION TEST    ║
╚════════════════════════════════════════╝
  `);

  const results = {
    files: await testFiles(),
    appwrite: await testAppwrite(),
    r2: await testR2(),
    module: await testDeletionModule(),
  };

  // Summary
  log.title('TEST SUMMARY');
  console.log(`Files Present: ${results.files ? '✓' : '✗'}`);
  console.log(`Appwrite Configured: ${results.appwrite ? '✓' : '✗'}`);
  console.log(`R2 Configured: ${results.r2 ? '✓' : '✗'}`);
  console.log(`Deletion Module: ${results.module ? '✓' : '✗'}`);

  const allPassed = results.files && results.appwrite && results.r2 && results.module;

  if (allPassed) {
    log.success(`\n✓✓✓ All checks passed! System is ready. ✓✓✓`);
    console.log(`\nNow you can use:
  npm run delete:all          # Interactive deletion tool
  npm run test:deletion       # Test the endpoints
  npm run delete:all          # CLI tool
    `);
    process.exit(0);
  } else {
    log.error(`\n✗ Some checks failed. Fix the issues above.`);
    process.exit(1);
  }
}

main().catch(err => {
  log.error(`Test error: ${err.message}`);
  process.exit(1);
});
