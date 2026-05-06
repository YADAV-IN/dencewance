/**
 * DELETION UTILS - Handles permanent deletion from all sources
 * Appwrite DB, Appwrite Storage, R2, MongoDB
 */

import { storage as appwriteStorage } from '../appwrite.js';
import { deleteR2ObjectByKey } from '../r2.js';

const APPWRITE_BUCKET_ID = process.env.APPWRITE_BUCKET_ID || 'alok_media';
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.trim() || '';
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim() || '';

// Enhanced Appwrite ID extraction
export const extractAppwriteFileId = (value) => {
  if (!value || typeof value !== 'string') return '';
  
  try {
    // Try URL parsing first
    try {
      const url = new URL(value);
      
      // Pattern 1: .../files/{id}/view
      let match = url.pathname.match(/\/files\/([a-z0-9]+)\/(?:view|download)/i);
      if (match) return match[1];
      
      // Pattern 2: .../files/{id}
      match = url.pathname.match(/\/files\/([a-z0-9]+)(?:\/|$)/i);
      if (match) return match[1];
    } catch (urlError) {
      // If URL parsing fails, try regex on string
      throw new Error('URL parse failed, trying string match');
    }
  } catch {
    // String-based patterns
    // Pattern 1: /storage/buckets/xxx/files/yyy/...
    let match = value.match(/\/files\/([a-z0-9]+)\/(?:view|download)/i);
    if (match) return match[1];
    
    // Pattern 2: appwrite...files/xxx
    match = value.match(/files\/([a-z0-9]+)(?:\/|$)/i);
    if (match) return match[1];
    
    // Pattern 3: Direct file IDs that look like appwrite IDs
    if (value.match(/^[a-z0-9]{20,}$/i)) return value;
  }
  
  return '';
};

// Enhanced R2 key extraction
export const extractR2Key = (value) => {
  if (!value || typeof value !== 'string') return '';
  
  try {
    const url = new URL(value);
    
    // Check against custom R2_PUBLIC_URL
    if (R2_PUBLIC_URL) {
      try {
        const publicUrl = new URL(R2_PUBLIC_URL);
        if (url.origin === publicUrl.origin) {
          const key = url.pathname
            .slice(publicUrl.pathname.length)
            .replace(/^\/+/, '');
          if (key) return decodeURIComponent(key);
        }
      } catch (e) {
        // Fallback to string matching
        if (value.startsWith(R2_PUBLIC_URL)) {
          return decodeURIComponent(value.slice(R2_PUBLIC_URL.length).replace(/^\/+/, ''));
        }
      }
    }
    
    // Check for r2.cloudflarestorage.com domain
    if (url.hostname.includes('.r2.cloudflarestorage.com')) {
      const key = url.pathname.replace(/^\/+/, '');
      return decodeURIComponent(key);
    }
    
    // Check for custom domain with account ID
    if (R2_ACCOUNT_ID && url.hostname.includes(R2_ACCOUNT_ID)) {
      const key = url.pathname.replace(/^\/+/, '');
      return decodeURIComponent(key);
    }
  } catch {
    // String-based extraction
    if (R2_PUBLIC_URL && value.startsWith(R2_PUBLIC_URL)) {
      return decodeURIComponent(value.slice(R2_PUBLIC_URL.length).replace(/^\/+/, ''));
    }
    
    // Try to match r2.cloudflarestorage.com pattern
    const match = value.match(/\.r2\.cloudflarestorage\.com\/(.+?)(?:\?|$)/i);
    if (match) return decodeURIComponent(match[1]);
  }
  
  return '';
};

// Delete single stored media file with detailed logging
export const deleteStoredMedia = async (value, options = {}) => {
  const { retries = 2, delay = 500, onLog = () => {} } = options;
  
  if (!value) {
    return { deleted: true, type: 'empty', ref: '', reason: 'Empty value' };
  }

  // Try Appwrite
  // Prefer R2 deletion first (Cloudflare R2)
  const r2Key = extractR2Key(value);
  if (r2Key) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await deleteR2ObjectByKey(r2Key);
        onLog(`✓ R2 file deleted: ${r2Key}`);
        return { deleted: true, type: 'r2', ref: r2Key, attempts: attempt + 1 };
      } catch (error) {
        onLog(`✗ R2 attempt ${attempt + 1} failed: ${error.message}`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delay * (attempt + 1)));
        }
      }
    }
    return { deleted: false, type: 'r2', ref: r2Key, error: 'Failed after retries' };
  }

  // Fallback to Appwrite storage deletion
  const appwriteId = extractAppwriteFileId(value);
  if (appwriteId) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await appwriteStorage.deleteFile(APPWRITE_BUCKET_ID, appwriteId);
        onLog(`✓ Appwrite file deleted: ${appwriteId}`);
        return { deleted: true, type: 'appwrite', ref: appwriteId, attempts: attempt + 1 };
      } catch (error) {
        onLog(`✗ Appwrite attempt ${attempt + 1} failed: ${error.message}`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delay * (attempt + 1)));
        }
      }
    }
    return { deleted: false, type: 'appwrite', ref: appwriteId, error: 'Failed after retries' };
  }

  // Could not identify
  onLog(`⊘ Skipped (unidentified storage): ${value.substring(0, 60)}...`);
  return { deleted: true, type: 'skipped', ref: value, reason: 'Could not identify storage type' };
};

// Batch delete with detailed reporting
export const deleteMultipleFiles = async (urls, options = {}) => {
  if (!urls || urls.length === 0) {
    return { success: true, total: 0, deleted: 0, failed: 0, results: [] };
  }

  const results = await Promise.all(
    urls.map((url, idx) => 
      deleteStoredMedia(url, {
        retries: options.retries || 2,
        delay: options.delay || 500,
        onLog: (msg) => {
          if (options.onLog) {
            options.onLog(`[${idx + 1}/${urls.length}] ${msg}`);
          }
        }
      })
    )
  );

  const deleted = results.filter(r => r.deleted === true).length;
  const failed = results.filter(r => r.deleted === false).length;

  return {
    success: failed === 0,
    total: urls.length,
    deleted,
    failed,
    results,
    summary: {
      appwrite: results.filter(r => r.type === 'appwrite').length,
      r2: results.filter(r => r.type === 'r2').length,
      skipped: results.filter(r => r.type === 'skipped').length,
    }
  };
};

// Safe export for Node.js
export default {
  extractAppwriteFileId,
  extractR2Key,
  deleteStoredMedia,
  deleteMultipleFiles,
};
