#!/usr/bin/env node
/**
 * Interactive setup script for Appwrite + R2 credentials
 * Run: node setup-env.js
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) =>
  new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });

const TEMPLATE = `# Appwrite (optional once fully migrated)
APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID={APPWRITE_PROJECT_ID}
APPWRITE_API_KEY={APPWRITE_API_KEY}
APPWRITE_DB_ID={APPWRITE_DB_ID}
APPWRITE_BUCKET_ID={APPWRITE_BUCKET_ID}

# Cloudflare R2 (required for migration)
R2_ACCOUNT_ID={R2_ACCOUNT_ID}
R2_ACCESS_KEY_ID={R2_ACCESS_KEY_ID}
R2_SECRET_ACCESS_KEY={R2_SECRET_ACCESS_KEY}
R2_BUCKET_NAME={R2_BUCKET_NAME}
R2_PUBLIC_URL={R2_PUBLIC_URL}

# JWT secret
JWT_SECRET={JWT_SECRET}

# Server config
PORT=4000
NODE_ENV=development
`;

const prompts = [
  { key: 'APPWRITE_PROJECT_ID', label: 'Appwrite Project ID', default: '69d60fbe002bae1e32d5' },
  { key: 'APPWRITE_API_KEY', label: 'Appwrite API Key (master token)', default: '' },
  { key: 'APPWRITE_DB_ID', label: 'Appwrite Database ID', default: '69d60fe8000c9bd92750' },
  { key: 'APPWRITE_BUCKET_ID', label: 'Appwrite Storage Bucket ID', default: 'alok_media' },
  { key: 'R2_ACCOUNT_ID', label: 'Cloudflare Account ID (from R2 > Settings)', default: '' },
  { key: 'R2_ACCESS_KEY_ID', label: 'R2 API Token (Access Key ID)', default: '' },
  { key: 'R2_SECRET_ACCESS_KEY', label: 'R2 API Token Secret', default: '' },
  { key: 'R2_BUCKET_NAME', label: 'R2 Bucket Name', default: '' },
  { key: 'R2_PUBLIC_URL', label: 'R2 Public URL (optional, e.g., https://media.example.com)', default: '' },
  { key: 'JWT_SECRET', label: 'JWT Secret for authentication', default: 'dev_secret_change_in_production' },
];

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   APPWRITE + CLOUDFLARE R2 SETUP      ║');
  console.log('╚════════════════════════════════════════╝\n');

  const values = {};

  for (const prompt of prompts) {
    const defaultText = prompt.default ? ` [${prompt.default}]` : '';
    const answer = await question(`${prompt.label}${defaultText}: `);
    values[prompt.key] = answer || prompt.default;
  }

  let envContent = TEMPLATE;
  for (const [key, value] of Object.entries(values)) {
    envContent = envContent.replace(`{${key}}`, value);
  }

  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent, 'utf-8');

  console.log(`\n✅ Created .env file at: ${envPath}`);
  console.log('✅ You can now run:');
  console.log('   node verify-deletion-system.js');
  console.log('   npm run dev (or your dev server)\n');

  rl.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
