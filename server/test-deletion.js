#!/usr/bin/env node
/**
 * TEST DELETION ENDPOINTS
 * Tests all permanent deletion functionality
 */

const BASE_URL = process.env.API_URL || 'http://localhost:4000';
const AUTH_TOKEN = process.env.ADMIN_TOKEN || '';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n${colors.blue}${msg}${colors.reset}\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`),
};

const api = {
  async deleteReel(reelId) {
    log.info(`Deleting reel: ${reelId}`);
    try {
      const res = await fetch(`${BASE_URL}/api/reels/${reelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await res.json();
      if (!res.ok) {
        log.error(`Failed to delete reel: ${data.error}`);
        return null;
      }

      log.success(`Reel deleted successfully`);
      if (data.data?.logs) {
        data.data.logs.forEach(l => console.log(`  ${l}`));
      }
      return data;
    } catch (error) {
      log.error(`API error: ${error.message}`);
      return null;
    }
  },

  async cleanupAll() {
    log.info('Running comprehensive cleanup');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/cleanup-all-orphaned`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        log.error(`Failed to cleanup: ${data.error}`);
        return null;
      }

      log.success(`Comprehensive cleanup completed`);
      if (data.summary) {
        console.log('\nCleanup Summary:');
        Object.entries(data.summary).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
      if (data.logs) {
        console.log('\nCleanup Logs:');
        data.logs.forEach(l => console.log(`  ${l}`));
      }
      return data;
    } catch (error) {
      log.error(`API error: ${error.message}`);
      return null;
    }
  },

  async getStatus() {
    log.info('Checking system status');
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      const data = await res.json();
      
      console.log('Status:', data.status);
      if (data.config) {
        console.log('Config:');
        Object.entries(data.config).forEach(([key, value]) => {
          console.log(`  ${key}: ${value ? '✓' : '✗'}`);
        });
      }
      return data;
    } catch (error) {
      log.error(`API error: ${error.message}`);
      return null;
    }
  },
};

const main = async () => {
  log.title('DELETION ENDPOINT TESTER');

  if (!AUTH_TOKEN) {
    log.warn('No AUTH_TOKEN provided. Set ADMIN_TOKEN environment variable.');
    log.info('Example: ADMIN_TOKEN=your_token npm test:deletion');
  }

  // Check system status
  log.info('Checking API connection...');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) {
      log.error(`API not responding. Is it running on ${BASE_URL}?`);
      process.exit(1);
    }
    log.success(`API is running on ${BASE_URL}`);
  } catch (error) {
    log.error(`Cannot connect to API: ${error.message}`);
    process.exit(1);
  }

  // Show menu
  console.log(`
Available operations:

  1. Delete specific reel
  2. Run comprehensive cleanup (⚠️  WARNING: DELETES ALL DATA)
  3. Check system status
  4. Exit

Usage:
  TEST_REEL_ID=<id> node test-deletion.js delete-reel
  node test-deletion.js cleanup-all
  node test-deletion.js status
  `);

  const operation = process.argv[2] || 'status';
  
  switch (operation) {
    case 'delete-reel':
      const reelId = process.env.TEST_REEL_ID;
      if (!reelId) {
        log.error('Please provide TEST_REEL_ID environment variable');
        process.exit(1);
      }
      await api.deleteReel(reelId);
      break;

    case 'cleanup-all':
      log.warn('This will delete ALL data from all sources!');
      console.log('Waiting 3 seconds before proceeding...');
      await new Promise(r => setTimeout(r, 3000));
      await api.cleanupAll();
      break;

    case 'status':
    default:
      await api.getStatus();
      break;
  }

  console.log('');
};

main().catch(err => {
  log.error(err.message);
  process.exit(1);
});
