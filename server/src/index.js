import 'dotenv/config';
import express from 'express';
import { execSync } from 'child_process';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { cacheRoute, clearCache } from './utils/redis.js';
import { s3Client, hasR2Config as oldHasR2Config, generatePresignedUrl, listAllR2Files } from './r2.js';
const hasR2Config = oldHasR2Config;
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDb, Admin, News, Reel, SiteSettings, Status, UserProfile, ReelComment, SavedReel, Report, AnalyticsEvent, AnalyticsError, DeveloperReport, useOfflineFallback, Pyq, Interaction, Follow, MusicTrack } from './db.js';
import { storage as appwriteStorage, databases as appwriteDatabases, APPWRITE_DB_ID, ID, Query } from './appwrite.js';
import { InputFile } from 'node-appwrite/file';
import { requireAuth, signToken, verifyAndGetAdminId } from './middleware/auth.js';
import { slugify } from './utils/slug.js';
import { getReadingTime } from './utils/readingTime.js';
import { deleteR2ObjectByKey } from './r2.js';
import { deleteStoredMedia, deleteMultipleFiles } from './utils/deletion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const populateCreatorDetails = async (items, idField, nameField, avatarField, handleField, currentUserId = null) => {
  if (!items) return items;
  const isArray = Array.isArray(items);
  const list = isArray ? items : [items];
  if (list.length === 0) return items;
  
  try {
    const adminDocs = await Admin.find().limit(100);
    const adminMap = new Map();
    adminDocs.forEach(a => {
      const id = a.id || a._id || a.$id;
      if (id) adminMap.set(id.toString(), a);
    });

    let myInteractions = [];
    let myFollows = [];
    if (currentUserId) {
      myInteractions = await Interaction.find({ user_id: currentUserId.toString() }) || [];
      myFollows = await Follow.find({ follower_id: currentUserId.toString() }) || [];
    }
    
    list.forEach(item => {
      if (!item) return;
      const authorId = item[idField];
      if (authorId && adminMap.has(authorId.toString())) {
        const admin = adminMap.get(authorId.toString());
        if (admin.name && nameField) item[nameField] = admin.name;
        if (admin.avatar_url && avatarField) item[avatarField] = admin.avatar_url;
        if (handleField) item[handleField] = admin.username || admin.email?.split('@')[0] || 'user';
      }

      if (currentUserId) {
        const targetId = (item._id || item.id || '').toString();
        item.is_liked_by_me = myInteractions.some(i => i.target_id === targetId && i.type === 'like');
        item.is_saved_by_me = myInteractions.some(i => i.target_id === targetId && i.type === 'save');
        
        if (authorId) {
           item.is_following_creator = myFollows.some(f => f.following_id === authorId.toString());
        }
      }
    });
  } catch (err) {
    console.error('Failed to populate creator details:', err);
  }
  return isArray ? list : list[0];
};

const app = express();
export const server = http.createServer(app);
export const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => { console.log('Client connected:', socket.id); });
app.get('/', (req, res) => res.json({ message: 'API is working! Open the frontend on Port 3000 to see the website.' }));
app.get('/', (req, res) => res.json({ message: 'API is working! Open the frontend on Port 3000 to see the website.' }));
app.get('/', (req, res) => res.json({ message: 'API is working! Open the frontend on Port 3000 to see the website.' }));
const PORT = process.env.PORT || 4000;
const IS_VERCEL = process.env.VERCEL === '1';
const readEnv = (name) => process.env[name]?.trim() || '';
const APPWRITE_BUCKET_ID = readEnv('APPWRITE_STORAGE_BUCKET_ID') || readEnv('APPWRITE_BUCKET_ID');
const APPWRITE_ENDPOINT = readEnv('APPWRITE_ENDPOINT') || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = readEnv('APPWRITE_PROJECT_ID') || '69d60fbe002bae1e32d5';
const JWT_SECRET = readEnv('JWT_SECRET') || 'dev_secret_change_me';
const APPWRITE_STORAGE_BASE = `${APPWRITE_ENDPOINT}/storage/buckets/`;
const buildAppwriteFileViewUrl = (bucketId, fileId) => {
  if (!bucketId || !fileId) return '';
  return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
};
const uploadPyqToAppwrite = async (buffer, originalName, mimeType) => {
  if (!APPWRITE_BUCKET_ID) {
    throw new Error('Appwrite bucket is not configured.');
  }

  const file = await appwriteStorage.createFile(
    APPWRITE_BUCKET_ID,
    ID.unique(),
    InputFile.fromBuffer(buffer, originalName || 'pyq-file')
  );

  return {
    id: file.$id,
    url: buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, file.$id),
    mimeType: mimeType || 'application/octet-stream',
  };
};
const deleteRelatedReelRows = async (reelId) => {
  const [comments, savedReels] = await Promise.all([
    ReelComment.find({ reel_id: reelId }),
    SavedReel.find({ reel_id: reelId }),
  ]);

  const commentResults = await Promise.all((comments || []).map((comment) => (typeof comment?.deleteOne === 'function' ? comment.deleteOne() : Promise.resolve(false))));
  const savedResults = await Promise.all((savedReels || []).map((row) => (typeof row?.deleteOne === 'function' ? row.deleteOne() : Promise.resolve(false))));
  return {
    deletedComments: commentResults.filter(Boolean).length,
    deletedSaved: savedResults.filter(Boolean).length,
  };
};

const toCanonicalUrl = (value = '') => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    parsed.hash = '';
    parsed.search = '';
    const pathname = parsed.pathname.replace(/\/+$|^\/+$/g, '');
    return `${parsed.origin.toLowerCase()}/${pathname}`;
  } catch {
    return raw.replace(/[?#].*$/, '').replace(/\/+$/, '');
  }
};

const reelUrlCandidates = (value = '') => {
  const canonical = toCanonicalUrl(value);
  if (!canonical) return [];

  const set = new Set([canonical]);
  try {
    const parsed = new URL(canonical);
    const key = parsed.pathname.replace(/^\/+/, '');
    if (key) {
      set.add(key);
      set.add(`/${key}`);
    }
  } catch {
    if (canonical.includes('/')) {
      const key = canonical.replace(/^\/+/, '');
      set.add(key);
      set.add(`/${key}`);
    }
  }
  return [...set];
};

const normalizeDeletedReelUrls = (urls = []) => {
  const list = Array.isArray(urls) ? urls : [urls];
  const expanded = list.flatMap((value) => reelUrlCandidates(value));
  return [...new Set(expanded.filter(Boolean))];
};

const isReelTombstoned = (reel, deletedSet) => {
  if (!reel || !deletedSet || deletedSet.size === 0) return false;
  const reelId = String(reel.id || reel._id || reel.$id || '').trim();
  const slug = String(reel.slug || '').trim();
  const candidates = [
    ...reelUrlCandidates(reel.video_url),
    ...reelUrlCandidates(reel.cover_image_url),
    reelId,
    reelId ? `id:${reelId}` : '',
    slug ? `slug:${slug}` : '',
  ].filter(Boolean);
  return candidates.some((candidate) => deletedSet.has(candidate));
};

const purgeDeletedReelMarkers = async (markers = []) => {
  const nextMarkers = normalizeDeletedReelUrls(markers);
  if (!nextMarkers.length) return;

  const existingSettings = await SiteSettings.find().sort({ created_at: -1 }).limit(1);
  const settings = existingSettings[0];
  if (!settings) return;

  const current = normalizeDeletedReelUrls(settings?.deleted_reel_urls || []);
  const filtered = current.filter((value) => !nextMarkers.includes(value));
  settings.deleted_reel_urls = filtered;
  await settings.save();
};

const getDeletedReelUrlSet = async () => {
  try {
    const settings = await SiteSettings.findOne();
    return new Set(normalizeDeletedReelUrls(settings?.deleted_reel_urls || []));
  } catch (error) {
    return new Set();
  }
};

const persistDeletedReelUrls = async (urls = []) => {
  const nextUrls = normalizeDeletedReelUrls(urls);
  if (!nextUrls.length) return;

  const existingSettings = await SiteSettings.find().sort({ created_at: -1 }).limit(1);
  const settings = existingSettings[0] || await SiteSettings.create({ deleted_reel_urls: nextUrls });
  const currentUrls = normalizeDeletedReelUrls(settings?.deleted_reel_urls || []);
  const mergedUrls = [...new Set([...currentUrls, ...nextUrls])];
  settings.deleted_reel_urls = mergedUrls;
  await settings.save();
};

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim() || '';
let R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.trim() || '';
if (R2_PUBLIC_URL && R2_PUBLIC_URL.endsWith('/')) {
  R2_PUBLIC_URL = R2_PUBLIC_URL.slice(0, -1);
}

const storage = hasR2Config
  ? multerS3({
      s3: s3Client,
      bucket: R2_BUCKET_NAME,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      contentType: function (req, file, cb) {
        cb(null, file.mimetype || 'application/octet-stream');
      },
      key: function (req, file, cb) {
        let folder = 'covers';
        if (file.fieldname === 'avatar') {
          folder = 'avatars';
        } else if (file.fieldname === 'media') {
          folder = 'media';
        }
        const fileExt = path.extname(file.originalname).substring(1) || 'bin';
        cb(null, `users/${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`);
      }
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
});

// PYQ packet uploads need raw buffer access so we can store file + DB row in one request.
const packetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.get('/', (req, res) => res.json({status: 'OK', message: 'Backend is running! Open Frontend on Port 3000'}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Developer-Secret'],
}));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.options('*', cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Developer-Secret'],
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use((req,res,next)=>{console.log(req.method, req.url); next();});
app.use('/api/posts', (req, res, next) => {
  req.url = req.originalUrl.replace(/^\/api\/posts/, '/api/news');
  next();
});

// Appwrite Reverse Proxy Route
app.all('/v1/*', async (req, res) => {
  try {
    const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
    const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5';
    // The req.originalUrl includes the query string and starts with /v1/
    // We just append whatever comes after /v1 to the base endpoint (which already has /v1).
    // Actually, APPWRITE_ENDPOINT is "https://nyc.cloud.appwrite.io/v1"
    // So if req.originalUrl is "/v1/account", we want "https://nyc.cloud.appwrite.io/v1/account"
    // So url = "https://nyc.cloud.appwrite.io" + req.originalUrl
    const APPWRITE_HOST = APPWRITE_ENDPOINT.replace(/\/v1\/?$/, '');
    const url = `${APPWRITE_HOST}${req.originalUrl}`;
    
    const headers = { ...req.headers };
    delete headers['host']; // Let fetch set the correct host
    delete headers['origin'];
    delete headers['referer'];
    headers['X-Appwrite-Project'] = APPWRITE_PROJECT_ID;

    // We can't easily proxy multipart/form-data using standard fetch if body is already parsed by multer.
    // Assuming standard JSON requests for most Appwrite calls (except storage which might go direct or fail).
    const options = {
      method: req.method,
      headers: headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.is('multipart/form-data')) {
        return res.status(501).json({ error: 'Multipart uploads through proxy are not supported yet. Please upload directly or use base64.' });
      }
      if (req.body && Object.keys(req.body).length > 0) {
        options.body = JSON.stringify(req.body);
      }
    }

    const { default: fetch } = await import('node-fetch');
    const response = await fetch(url, options);
    
    // Pass back headers
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    // Pipe the response stream directly to res to avoid parsing issues
    res.status(response.status);
    response.body.pipe(res);
  } catch (error) {
    console.error('Appwrite Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', message: error.message });
  }
});

let dbInitialized = false;
let dbInitPromise = null;

const ensureDbInit = async () => {
  if (dbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = initDb().then(() => { dbInitialized = true; }).catch(err => {
      console.error('DB init error:', err);
      dbInitPromise = null;
      throw err;
    });
  }
  return dbInitPromise;
};

app.get('/api/health', async (req, res) => {
  const dbReady = dbInitialized;
  const config = {
    appwrite: !!process.env.APPWRITE_DB_ID,
    jwt: !!process.env.JWT_SECRET,
    r2: hasR2Config,
  };
  const status = dbReady ? 'ok' : 'degraded';

  return res.status(dbReady ? 200 : 503).json({
    status,
    time: new Date().toISOString(),
    vercel: IS_VERCEL,
    dbReady,
    config,
  });
});
// --- DIRECT TEST ROUTES (NO LOGIN REQUIRED) ---

// Test 1: Check if R2 is configured
app.get('/api/test/r2-status', (req, res) => {
  res.json({
    r2_configured: hasR2Config,
    r2_account_id: process.env.R2_ACCOUNT_ID ? 'SET' : 'MISSING',
    r2_access_key: process.env.R2_ACCESS_KEY_ID ? 'SET' : 'MISSING',
    r2_secret_key: process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
    r2_bucket: process.env.R2_BUCKET_NAME || 'MISSING',
    r2_public_url: process.env.R2_PUBLIC_URL || 'MISSING',
    offline_mode: process.env.OFFLINE_MODE,
  });
});

// Test 2: Direct file upload WITHOUT login
app.post('/api/test/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file. Send with field name "file"' });
    }
    if (hasR2Config && req.file.location) {
      return res.json({
        success: true,
        message: 'Upload to R2 SUCCESSFUL!',
        url: req.file.location,
        key: req.file.key,
        size: req.file.size,
      });
    }
    return res.json({
      success: false,
      message: 'R2 NOT configured! File went to memory only.',
      r2_configured: hasR2Config,
      file_size: req.file.size,
    });
  } catch (err) {
    console.error('Test upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- DEVELOPER DASHBOARD VERSIONS ---
app.get('/api/admin/versions', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || currentUser.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only developers/superadmins can view versions' });
    }
    
    // Fetch last 30 commits from git history
    try {
      const gitLog = execSync('git log --pretty=format:"%h|%ad|%s" --date=short -n 30').toString();
      const versions = gitLog.split('\n').map(line => {
        const [hash, date, ...msgParts] = line.split('|');
        return {
          hash,
          date,
          message: msgParts.join('|')
        };
      }).filter(v => v.hash);
      
      return res.json({ success: true, data: versions });
    } catch (gitErr) {
      console.warn('Git log failed, returning dummy versions', gitErr);
      return res.json({ success: true, data: [
        { hash: 'e8c2765', date: new Date().toISOString().split('T')[0], message: 'Fallback: Git not available on production build' }
      ]});
    }
  } catch (err) {
    console.error('Versions API Error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching versions' });
  }
});

// --- COMPREHENSIVE CLEANUP ---
app.post('/api/admin/cleanup-all-orphaned', requireAuth, async (req, res) => {
  try {
    // Only superadmin can run this
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || currentUser.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can run cleanup.' });
    }

    const logs = [];
    const log = (msg) => {
      const timestamp = new Date().toISOString();
      logs.push(`[${timestamp}] ${msg}`);
      console.log(`[CLEANUP] ${msg}`);
    };

    log('🚀 COMPREHENSIVE CLEANUP STARTED');

    // 1. Appwrite Storage cleanup: DISABLED (migrated to R2)
    log('📦 Skipping Appwrite Storage cleanup (disabled — using R2 instead)');

    // 2. Delete ALL files from R2
    let r2Deleted = 0;
    if (hasR2Config) {
      log('📦 Cleaning R2...');
      try {
        const files = await listAllR2Files();
        for (const file of files) {
          try {
            await deleteR2ObjectByKey(file.key);
            r2Deleted++;
          } catch (e) {
            log(`  ⚠️ Failed to delete: ${file.key}`);
          }
        }
        log(`  ✓ Deleted ${r2Deleted} files from R2`);
      } catch (e) {
        log(`  ❌ Error accessing R2: ${e.message}`);
      }
    } else {
      log('⊘ R2 not configured');
    }

    // 3. Delete ALL reels and related data from MongoDB
    log('🗑️ Cleaning MongoDB...');
    const [reelsDeleted, commentsDeleted, savedDeleted] = await Promise.all([
      Reel.deleteMany({}),
      ReelComment.deleteMany({}),
      SavedReel.deleteMany({}),
    ]);
    log(`  ✓ Deleted ${reelsDeleted.deletedCount} reels`);
    log(`  ✓ Deleted ${commentsDeleted.deletedCount} comments`);
    log(`  ✓ Deleted ${savedDeleted.deletedCount} saved entries`);

    // Clear all caches
    await Promise.all([
      clearCache('reels'),
      clearCache('news'),
    ]).catch(e => log(`  ⚠️ Cache clear error: ${e.message}`));

    log('✅ COMPREHENSIVE CLEANUP COMPLETE');

    return res.json({
      success: true,
      message: 'All data permanently deleted from all sources.',
      summary: {
        appwrite_storage: appwriteDeleted,
        r2: r2Deleted,
        mongodb_reels: reelsDeleted.deletedCount,
        mongodb_comments: commentsDeleted.deletedCount,
        mongodb_saved: savedDeleted.deletedCount,
      },
      logs: logs,
    });
  } catch (error) {
    console.error('[CLEANUP ERROR]', error);
    return res.status(500).json({
      error: 'Cleanup failed.',
      message: error?.message,
    });
  }
});

// --- BULK DELETE ALL REELS (ADMIN ONLY) ---
app.delete('/api/reels/bulk-delete', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Only admins can bulk delete reels.' });
    }

    const allReels = await Reel.find().limit(1000).lean();
    const deletedUrls = [];
    let deleted = 0;
    for (const reel of allReels) {
      try {
        deletedUrls.push(reel.video_url, reel.cover_image_url, reel.file_url, reel.fileUrl, reel.video_file_url, reel.cover_file_url);
        await Reel.findByIdAndDelete(reel._id);
        deleted++;
      } catch (e) {
        console.error('Failed to delete reel:', reel._id, e);
      }
    }

    await persistDeletedReelUrls(deletedUrls);

    await clearCache('reels');
    return res.json({ success: true, deletedCount: deleted });
  } catch (err) {
    console.error('Bulk delete reels error:', err);
    return res.status(500).json({ error: 'Failed to bulk delete reels.' });
  }
});

app.use(async (req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  try {
    await ensureDbInit();
    next();
  } catch (err) {
    console.error('DB init middleware error:', err);
    return res.status(503).json({
      error: 'Database initialization failed',
      detail: err?.message || 'Unknown database error',
    });
  }
});

app.post('/api/auth/oauth-sync', async (req, res) => {
  try {
    const { uid, name, email, phoneNumber, avatar_url } = req.body || {};
    
    let admin = null;
    
    if (email) {
      admin = await Admin.findOne({ email });
    }
    if (!admin && phoneNumber) {
      admin = await Admin.findOne({ phoneNumber });
    }
    if (!admin && uid) {
      admin = await Admin.findOne({ uid });
    }
    
    if (!admin) {
      // Create new user profile / admin
      let username;
      if (email) {
        username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      } else {
        // For phone users, generate a friendly random username instead of raw phone digits
        username = 'user_' + Math.random().toString(36).slice(2, 8);
      }
      // Ensure username is at least 3 chars
      if (username.length < 3) username = 'user_' + Math.random().toString(36).slice(2, 8);
      const newEmail = email || `${username}@dencewance.com`;
      
      admin = await Admin.create({
        uid: uid || '',
        name: name || `User ${username}`,
        email: newEmail,
        phoneNumber: phoneNumber || '',
        username,
        role: 'admin',
        status: 'active',
        bio: 'Dancer on DenceWance',
        avatar_url: avatar_url || '',
        password_hash: ''
      });
    } else {
      let updated = false;
      if (uid && admin.uid !== uid) { admin.uid = uid; updated = true; }
      if (phoneNumber && admin.phoneNumber !== phoneNumber) { admin.phoneNumber = phoneNumber; updated = true; }
      if (avatar_url && !admin.avatar_url) { admin.avatar_url = avatar_url; updated = true; }
      if (updated) {
        await admin.save();
      }
    }
    
    const token = signToken(admin._id.toString());
    return res.json({
      data: {
        token,
        profile: admin.toJSON(),
      },
    });
  } catch (err) {
    console.error('OAuth sync error:', err);
    return res.status(500).json({ error: 'OAuth sync failed.' });
  }
});

app.get('/api/auth/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required.' });

    const isValid = /^[a-z0-9_]{3,20}$/.test(username);
    if (!isValid) {
      return res.json({ available: false, reason: 'invalid_format' });
    }

    let requestingUserId = null;
    if (req.headers.authorization) {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        requestingUserId = await verifyAndGetAdminId(token);
      } catch(e) {}
    }

    const admins = await Admin.find().lean();
    const taken = admins.some(a => {
      const aId = a.id || a._id;
      if (requestingUserId && requestingUserId === aId.toString()) {
        return false; // Skip checking self
      }
      
      const handle = (a.username || a.email?.split('@')[0] || '').toLowerCase();
      return handle === username.toLowerCase();
    });

    return res.json({ available: !taken });
  } catch (err) {
    console.error('Check username error:', err);
    return res.status(500).json({ error: 'Failed to check username.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required.' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (admin.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    admin.last_login = new Date();
    await admin.save();

    const token = signToken(admin._id.toString());
    return res.json({
      data: {
        token,
        profile: admin.toJSON(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/api/admins', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return res.status(403).json({ error: 'Permission denied. Admin access required.' });
    }

    const { name, email, password, role = 'author', bio = '' } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required.' });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name, email, password_hash, role, status: 'active', bio, avatar_url: ''
    });

    return res.status(201).json({ data: admin.toJSON() });
  } catch (error) {
    console.error('Admin create error:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

app.get('/api/admins', requireAuth, async (req, res) => {
  try {
    const admins = await Admin.find().sort({ role: 1, created_at: -1 }).lean();
    return res.json({ data: admins.map(a => ({ ...a, id: a._id.toString(), _id: undefined, __v: undefined, password_hash: undefined })) });
  } catch (error) {
    console.error('Admin list error:', error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

app.put('/api/admins/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const currentUser = await Admin.findById(req.adminId);
  const targetUser = await Admin.findById(id);

  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && req.adminId !== id) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const { name, email, role, status, bio } = req.body || {};

  if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && (role || status)) {
    return res.status(403).json({ error: 'Cannot change role or status.' });
  }

  if (name) targetUser.name = name;
  if (email) targetUser.email = email;
  if (role) targetUser.role = role;
  if (status) targetUser.status = status;
  if (bio !== undefined) targetUser.bio = bio;
  if (req.body.avatar_url !== undefined) targetUser.avatar_url = req.body.avatar_url;

  await targetUser.save();
  return res.json({ data: targetUser.toJSON() });
});

app.put('/api/admins/:id/password', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password required.' });

  const currentUser = await Admin.findById(req.adminId);

  if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && req.adminId !== id) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const targetUser = await Admin.findById(id);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  targetUser.password_hash = await bcrypt.hash(password, 10);
  await targetUser.save();

  return res.json({ data: { id, message: 'Password updated successfully' } });
});

app.get('/api/admins/:id', requireAuth, async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ data: user.toJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admins/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const currentUser = await Admin.findById(req.adminId);

  if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permission denied. Admin access required.' });
  }

  if (req.adminId === id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }

  const targetUser = await Admin.findById(id);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  await Admin.findByIdAndDelete(id);
  return res.json({ data: { id, message: 'User deleted successfully' } });
});

app.get('/api/profile', requireAuth, async (req, res) => {
  const admin = await Admin.findById(req.adminId);
  if (!admin) return res.status(404).json({ error: 'Profile not found.' });
  return res.json({ data: admin.toJSON() });
});

async function syncProfileUpdatesToDbContent(adminId, updates) {
  if (!adminId) return;
  try {
    const adminIdStr = adminId.toString();

    // 1. Sync to Reels
    const userReels = await Reel.find({ creator_id: adminIdStr });
    for (const reel of userReels) {
      const reelUpdates = {};
      if (updates.name !== undefined) reelUpdates.creator_name = updates.name;
      if (updates.username !== undefined) reelUpdates.creator_handle = updates.username;
      if (updates.avatar_url !== undefined) reelUpdates.creator_avatar = updates.avatar_url;
      if (Object.keys(reelUpdates).length > 0) {
        await Reel.findByIdAndUpdate(reel.$id, reelUpdates);
      }
    }

    // 2. Sync to News (Posts)
    const userNews = await News.find({ author_id: adminIdStr });
    for (const post of userNews) {
      const postUpdates = {};
      if (updates.name !== undefined) postUpdates.author_name = updates.name;
      if (updates.avatar_url !== undefined) postUpdates.source = updates.avatar_url;
      if (Object.keys(postUpdates).length > 0) {
        await News.findByIdAndUpdate(post.$id, postUpdates);
      }
    }

    // 3. Sync to Comments
    const userComments = await ReelComment.find({ user_id: adminIdStr });
    for (const comment of userComments) {
      const commentUpdates = {};
      if (updates.name !== undefined) commentUpdates.author_name = updates.name;
      if (updates.username !== undefined) commentUpdates.author_handle = '@' + updates.username.replace(/^@/, '');
      if (updates.avatar_url !== undefined) commentUpdates.author_avatar = updates.avatar_url;
      if (Object.keys(commentUpdates).length > 0) {
        await ReelComment.findByIdAndUpdate(comment.$id, commentUpdates);
      }
    }
  } catch (err) {
    console.error('Failed to sync profile updates to database content:', err);
  }
}

app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const { name, email, bio, avatar_url, username } = req.body || {};
    const updates = {};
    if (typeof name === 'string') updates.name = name;
    if (typeof email === 'string') updates.email = email;
    if (typeof bio === 'string') updates.bio = bio;
    if (typeof avatar_url === 'string') updates.avatar_url = avatar_url;
    if (typeof username === 'string') {
      if (/^[a-z0-9_]{3,20}$/.test(username)) {
        updates.username = username;
      }
    }
    const admin = await Admin.findByIdAndUpdate(
      req.adminId,
      updates,
      { new: true }
    );
  
    if (!admin) {
      return res.status(404).json({ error: 'User profile not found. Please log out and log back in.' });
    }

    // Sync to database content
    await syncProfileUpdatesToDbContent(req.adminId, updates);
  
    return res.json({ data: admin.toJSON() });
  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({ error: 'Failed to save profile. Server error.' });
  }
});

app.post('/api/profile/avatar', requireAuth, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('Avatar Multer/S3 Upload Error:', err);
      return res.status(500).json({ error: 'Avatar Upload Failed: ' + (err.message || 'Check R2 credentials') });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    if (useOfflineFallback) {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = path.extname(req.file.originalname || '') || '.png';
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, fileName), req.file.buffer);
      const publicUrl = `/uploads/${fileName}`;
      
      const admin = await Admin.findByIdAndUpdate(
        req.adminId,
        { avatar_url: publicUrl },
        { new: true }
      );
      if (!admin) return res.status(404).json({ error: 'User profile not found. Please log out and log back in.' });
      
      // Sync to database content
      await syncProfileUpdatesToDbContent(req.adminId, { avatar_url: publicUrl });

      return res.json({ data: admin.toJSON(), url: publicUrl });
    }

    if (hasR2Config && (req.file.location || req.file.key)) {
      const publicUrl = R2_PUBLIC_URL && req.file.key ? `${R2_PUBLIC_URL}/${req.file.key}` : req.file.location;
      const admin = await Admin.findByIdAndUpdate(
        req.adminId,
        { avatar_url: publicUrl },
        { new: true }
      );
      if (!admin) return res.status(404).json({ error: 'User profile not found. Please log out and log back in.' });
      
      // Sync to database content
      await syncProfileUpdatesToDbContent(req.adminId, { avatar_url: publicUrl });

      return res.json({ data: admin.toJSON() });
    }

    const appwriteFile = await appwriteStorage.createFile(
      APPWRITE_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(req.file.buffer, req.file.originalname || 'cover-file')
    );
    const publicUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, appwriteFile.$id);
    return res.json({
      data: {
        url: publicUrl,
        original_name: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Appwrite avatar upload error:', error);
    return res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// --- UNIFIED SEARCH ENDPOINT --- //
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) {
      return res.json({ skip: true, data: { users: [], posts: [], reels: [] } });
    }

    const [userById, postById, reelById] = await Promise.all([
      Admin.findById(q),
      News.findById(q),
      Reel.findById(q)
    ]);

    const searchPromises = q.length >= 3 ? Promise.all([
      Admin.search(['name', 'email', 'bio'], q, { limit: 20 }),
      News.search(['title', 'excerpt', 'content', 'category'], q, { limit: 20 }),
      Reel.search(['title', 'caption', 'creator_name', 'creator_handle'], q, { limit: 20 })
    ]) : Promise.resolve([[], [], []]);

    const [users, posts, reels] = await searchPromises;

    const dedupe = (items) => {
      const seen = new Set();
      const output = [];
      for (const item of items.flat().filter(Boolean)) {
        const itemId = item.id || item._id;
        if (!itemId || seen.has(itemId)) continue;
        seen.add(itemId);
        output.push(item);
      }
      return output;
    };

    let allReels = [];
    if (reelById) allReels.push(reelById);
    if (reels && reels.length) allReels = allReels.concat(reels);
    
    const populatedReels = await populateCreatorDetails(allReels, 'creator_id', 'creator_name', 'creator_avatar', 'creator_handle');
    
    const normalize = arr => arr.map(a => ({ ...a, id: a._id.toString(), _id: undefined }));

    const responseUsers = [];
    if (userById) responseUsers.push(userById);
    users.forEach(u => {
      if (!responseUsers.find(ru => (ru._id && ru._id.toString() === u._id.toString()))) {
        responseUsers.push(u);
      }
    });

    const responsePosts = [];
    if (postById) responsePosts.push(postById);
    posts.forEach(p => {
      if (!responsePosts.find(rp => (rp._id && rp._id.toString() === p._id.toString()))) {
        responsePosts.push(p);
      }
    });

    return res.json({
      success: true,
      data: {
        users: normalize(responseUsers),
        posts: normalize(responsePosts),
        reels: normalize(populatedReels)
      }
    });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ success: false, error: 'Database search failed' });
  }
});

// --- RECOMMENDATIONS ENDPOINT --- //
app.get('/api/recommendations', async (req, res) => {
  try {
    const [trendingReels, popularTags] = await Promise.all([
      Reel.find({ status: 'published' }).sort({ published_at: -1, views: -1 }).limit(10).select('title cover_image_url creator_name creator_id views tags').lean(),
      Reel.aggregate([
        { $match: { status: 'published', tags: { $exists: true, $not: {$size: 0} } } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    const populatedReels = await populateCreatorDetails(trendingReels, 'creator_id', 'creator_name', 'creator_avatar', 'creator_handle');
    
    const normalize = arr => arr.map(a => ({ ...a, id: a._id.toString(), _id: undefined }));
    
    return res.json({
      success: true,
      data: {
        reels: normalize(populatedReels),
        tags: popularTags.map(t => t._id)
      }
    });
  } catch(err) {
    console.error('Recommendations error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch recommendations' });
  }
});

// Backward-compatible feed aliases expected by frontend clients.
app.get('/api/posts', cacheRoute(30, 'news'), async (req, res) => {
  try {
    const { limit = 12, category, q, status, featured, breaking, author_id } = req.query;
    const query = {};
    if (category) query.category = category;
    if (author_id) query.author_id = author_id;
    if (status) query.status = status;
    if (featured === 'true') query.is_featured = 1;
    if (breaking === 'true') query.is_breaking = 1;
    if (q) {
      query.$or = [
        { title: new RegExp(q, 'i') },
        { content: new RegExp(q, 'i') }
      ];
    }

    const news = await News.find(query)
      .sort({ published_at: -1 })
      .limit(Math.min(Number(limit) || 12, 100))
      .lean();

    const populated = await populateCreatorDetails(news, 'author_id', 'author_name', 'source');
    return res.json({ data: populated.map(n => ({ ...n, id: n._id.toString(), _id: undefined, __v: undefined })) });
  } catch (error) {
    console.error('Posts list error:', error);
    return res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

app.get('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!news) return res.status(404).json({ error: 'Post not found.' });
    return res.json({ data: news.toJSON() });
  } catch (error) {
    console.error('Post detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch post detail.' });
  }
});

app.get('/api/news', cacheRoute(30, 'news'), async (req, res) => {
  try {
    const { limit = 12, category, q, status, featured, breaking, author_id } = req.query;
    const query = {};
    if (category) query.category = category;
    if (author_id) query.author_id = author_id;
    if (status) query.status = status;
    if (featured === 'true') query.is_featured = 1;
    if (breaking === 'true') query.is_breaking = 1;
    if (q) {
      query.$or = [
        { title: new RegExp(q, 'i') },
        { content: new RegExp(q, 'i') }
      ];
    }

    const news = await News.find(query)
      .sort({ published_at: -1 })
      .limit(Math.min(Number(limit) || 12, 100))
      .lean();

    const populated = await populateCreatorDetails(news, 'author_id', 'author_name', 'source');
    return res.json({ data: populated.map(n => ({ ...n, id: n._id.toString(), _id: undefined, __v: undefined })) });
  } catch (error) {
    console.error('News list error:', error);
    return res.status(500).json({ error: 'Failed to fetch news.' });
  }
});

app.get('/api/news/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!news) return res.status(404).json({ error: 'News not found.' });
    return res.json({ data: news.toJSON() });
  } catch (error) {
    console.error('News detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch news detail.' });
  }
});

async function findUniqueSlug(baseSlug) {
  let uniqueSlug = baseSlug;
  let counter = 1;
  while (await News.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

async function findUniqueReelSlug(baseSlug) {
  const safeBase = baseSlug || `reel-${Date.now()}`;
  let uniqueSlug = safeBase;
  let counter = 1;
  while (await Reel.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${safeBase}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

function detectReelSourceType(url = '') {
  if (!url || typeof url !== 'string') return 'upload';
  if (/youtu\.be|youtube\.com/i.test(url)) return 'youtube';
  if (/instagram\.com\/(reel|p|tv)\//i.test(url)) return 'instagram';
  return 'upload';
}

function extractYouTubeId(url = '') {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match?.[1] || '';
}

function extractInstagramCode(url = '') {
  const match = url.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
  return match?.[1] || '';
}

function normalizeReelVideoUrl(url = '') {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  const ytId = extractYouTubeId(trimmed);
  if (ytId) return `https://www.youtube.com/watch?v=${ytId}`;

  const instaCode = extractInstagramCode(trimmed);
  if (instaCode) return `https://www.instagram.com/reel/${instaCode}/`;

  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

function getVideoDedupKey(url = '') {
  const normalized = normalizeReelVideoUrl(url);
  if (!normalized) return '';

  const ytId = extractYouTubeId(normalized);
  if (ytId) return `yt:${ytId}`;

  const instaCode = extractInstagramCode(normalized);
  if (instaCode) return `ig:${instaCode.toLowerCase()}`;

  try {
    const parsed = new URL(normalized);
    return `url:${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return `raw:${normalized.toLowerCase()}`;
  }
}

const DEMO_CREATOR_POOL_SIZE = 3000;

function createSeedHash(input = '') {
  const value = String(input || 'seed');
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getSyntheticFollowerCount(seedInput = '') {
  const hash = createSeedHash(seedInput || Date.now());
  const bucket = hash % 100;

  if (bucket < 12) {
    return 50 + (hash % 700); // 50 - 749
  }
  if (bucket < 67) {
    return 100000 + (hash % 900000); // 100k - 999k
  }
  return 1000 + (hash % 98000); // 1k - 99k
}

function pickAutoCreatorProfile(seedInput = '') {
  const hash = createSeedHash(seedInput || Date.now());
  const number = (hash % DEMO_CREATOR_POOL_SIZE) + 1;
  const padded = String(number).padStart(4, '0');
  return {
    name: `Creator ${padded}`,
    handle: `creator_${padded}`,
    follower_count: getSyntheticFollowerCount(`${seedInput}-${padded}`),
  };
}

function makeStableCreatorId(prefix = 'creator', seedInput = '') {
  const hash = Math.abs(createSeedHash(seedInput || `${prefix}-${Date.now()}`)).toString(36);
  return `${prefix}_${hash.slice(0, 10)}`;
}

function resolveCreatorIdentity({ payload = {}, currentUser = null, fallbackSeed = '' } = {}) {
  const mode = (payload.creator_mode || (currentUser ? 'official' : 'anonymous') || 'auto').toLowerCase();
  const incomingCreatorId = String(payload.creator_id || payload.creatorId || payload.uploaderId || payload.uploader_id || '').trim();
  const fallbackIdSeed = fallbackSeed || payload.title || payload.video_url || payload.slug || 'reel';
  const officialCreatorId = incomingCreatorId || currentUser?._id?.toString() || makeStableCreatorId('official', fallbackIdSeed);
  const developerCreatorId = incomingCreatorId || readEnv('DEVELOPER_CREATOR_ID') || makeStableCreatorId('dev', fallbackIdSeed);
  const anonymousCreatorId = incomingCreatorId || makeStableCreatorId('anon', fallbackIdSeed);

  const creatorCommon = {
    creator_avatar: payload.creator_avatar || currentUser?.avatar_url || '',
    follower_count: Number(payload.follower_count) > 0 ? Number(payload.follower_count) : 0,
    is_demo_creator: false,
  };

  if (mode === 'developer') {
    return {
      creator_mode: 'developer',
      is_official_creator: false,
      creator_id: developerCreatorId,
      creator_name: payload.custom_author_name || payload.creator_name || 'Developer',
      creator_handle: payload.creator_handle || slugify((payload.custom_author_name || payload.creator_name || 'developer').toLowerCase()),
      ...creatorCommon,
    };
  }

  if (mode === 'anonymous') {
    return {
      creator_mode: 'anonymous',
      is_official_creator: false,
      creator_id: anonymousCreatorId,
      creator_name: payload.custom_author_name || payload.creator_name || 'Anonymous Creator',
      creator_handle: payload.creator_handle || slugify((payload.custom_author_name || payload.creator_name || 'anonymous creator').toLowerCase()),
      ...creatorCommon,
    };
  }

  if (mode === 'official' || !payload.creator_mode) {
    return {
      creator_mode: 'official',
      is_official_creator: true,
      creator_id: officialCreatorId,
      creator_name: payload.custom_author_name || payload.creator_name || currentUser?.name || 'Dencewance Demo',
      creator_handle: payload.creator_handle || slugify((payload.custom_author_name || currentUser?.name || 'dencewance-demo').toLowerCase()),
      creator_avatar: payload.creator_avatar || currentUser?.avatar_url || '',
      follower_count: Number(payload.follower_count) > 0
        ? Number(payload.follower_count)
        : (Number(currentUser?.followers) > 0 ? Number(currentUser.followers) : 12500),
      is_demo_creator: false,
    };
  }
  
  if (mode === 'male') {
    const name = payload.custom_author_name || 'Dencewance Boy';
    return {
      creator_mode: 'male',
      is_official_creator: false,
      creator_id: incomingCreatorId || makeStableCreatorId('male', fallbackIdSeed),
      is_demo_creator: false,
      creator_name: name,
      creator_handle: slugify((name).toLowerCase()),
      creator_avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      follower_count: Math.floor(Math.random() * 5000) + 100,
    };
  }

  if (mode === 'female') {
    const name = payload.custom_author_name || 'Dencewance Girl';
    return {
      creator_mode: 'female',
      is_official_creator: false,
      creator_id: incomingCreatorId || makeStableCreatorId('female', fallbackIdSeed),
      is_demo_creator: false,
      creator_name: name,
      creator_handle: slugify((name).toLowerCase()),
      creator_avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      follower_count: Math.floor(Math.random() * 15000) + 1000,
    };
  }

  const autoProfile = pickAutoCreatorProfile(fallbackSeed || payload.title || payload.video_url);
  return {
    creator_mode: 'auto',
    is_official_creator: false,
    creator_id: incomingCreatorId || makeStableCreatorId('auto', fallbackIdSeed),
    is_demo_creator: false,
    creator_name: payload.creator_name || autoProfile.name,
    creator_handle: payload.creator_handle || autoProfile.handle,
    creator_avatar: payload.creator_avatar || '',
    follower_count: Number(payload.follower_count) > 0
      ? Number(payload.follower_count)
      : autoProfile.follower_count,
  };
}

function getHostname(url = '') {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function getDomainQualityScore(url = '') {
  const host = getHostname(url);
  if (!host) return 0;

  const trustedHosts = [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'instagram.com',
    'www.instagram.com',
    'cdninstagram.com',
    'fbcdn.net',
    'cloudinary.com',
    'res.cloudinary.com',
  ];

  if (trustedHosts.some((item) => host === item || host.endsWith(`.${item}`))) return 12;
  if (host.includes('cdn')) return 7;
  return 3;
}

function isValidHttpUrl(url = '') {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function isLikelyPlayableVideoUrl(url = '') {
  const sourceType = detectReelSourceType(url);
  if (sourceType === 'youtube' || sourceType === 'instagram') {
    return true;
  }

  const lower = url.toLowerCase();
  if (/\.(mp4|mov|webm|m3u8)(\?|$)/i.test(lower)) return true;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (response.ok && contentType.includes('video')) return true;
    if (response.ok && (contentType.includes('octet-stream') || contentType.includes('application/vnd.apple.mpegurl'))) {
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function scoreReelForGlobalFeed(item) {
  const now = Date.now();
  const publishedAt = item.published_at ? new Date(item.published_at).getTime() : (item.created_at ? new Date(item.created_at).getTime() : now);
  const ageHours = Math.max(0.1, (now - publishedAt) / 3600000);
  
  // Advanced Freshness Curve: Logarithmic decay to keep new content highly visible but fade gracefully
  const freshnessScore = Math.max(0, 150 / Math.log10(ageHours + 1.5));
  
  const views = Number(item.views) || 0;
  const likes = Number(item.likes) || 0;
  const shares = Number(item.shares) || 0;
  
  // Mature Virality Multiplier: high weight on shares & likes
  const engagementScore = (likes * 3.5) + (shares * 5.0) + (views * 0.15);
  
  // Time-decayed Virality: if something gets lots of views very quickly, it's viral
  const viralityCoefficient = (views > 100) ? (engagementScore / ageHours) * 0.5 : 0;
  
  // Official creator trust bonus
  const officialBonus = item.is_official_creator ? 40 : (item.creator_mode === 'official' ? 30 : 0);
  
  // Alive Feed Jitter: Adds slight dynamic randomness so the feed isn't 100% static
  const randomJitter = Math.random() * 20;

  return engagementScore + freshnessScore + viralityCoefficient + officialBonus + randomJitter;
}

function mixSourcesForFeed(list = []) {
  // The new Intelligent Algorithm relies purely on the advanced computed score
  return list.sort((a, b) => b.feed_score - a.feed_score);
}

app.get('/api/reels', async (req, res) => {
  try {
    const { limit = 100, active = 'true', creator_id, viewer_id } = req.query;
    const query = {};
    if (active === 'true') query.is_active = true;
    if (creator_id) query.creator_id = creator_id;

    const reels = await Reel.find(query)
      .sort({ published_at: -1 })
      .limit(Math.min(Number(limit) || 100, 500))
      .lean();
    const deletedUrlSet = await getDeletedReelUrlSet();
    const visibleReels = reels.filter((reel) => !isReelTombstoned(reel, deletedUrlSet));
    const populated = await populateCreatorDetails(visibleReels, 'creator_id', 'creator_name', 'creator_avatar', 'creator_handle', viewer_id);

    // Disable all caching for reels - always fresh data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    return res.json({ data: populated.map((item) => ({ ...item, id: item._id.toString(), _id: undefined, __v: undefined })) });
  } catch (error) {
    console.error('Reels list error:', error);
    return res.status(500).json({ error: 'Failed to fetch reels.' });
  }
});

app.get('/api/reels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findById(id).lean();
    if (!reel) return res.status(404).json({ error: 'Reel not found.' });
    const deletedUrlSet = await getDeletedReelUrlSet();
    if (isReelTombstoned(reel, deletedUrlSet)) {
      return res.status(404).json({ error: 'Reel not found.' });
    }
    const populatedReel = await populateCreatorDetails(reel, 'creator_id', 'creator_name', 'creator_avatar', 'creator_handle');
    return res.json({ data: { ...populatedReel, id: populatedReel._id.toString(), _id: undefined, __v: undefined } });
  } catch (error) {
    console.error('Reel detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch reel.' });
  }
});

app.get('/api/reels/recommendations', async (req, res) => {
  try {
    const { limit = 120, active = 'true' } = req.query;
    const query = {};
    if (active === 'true') query.is_active = true;

    const reels = await Reel.find(query)
      .sort({ published_at: -1 })
      .limit(Math.min(Number(limit) || 120, 250))
      .lean();
    const deletedUrlSet = await getDeletedReelUrlSet();
    const visibleReels = reels.filter((reel) => !isReelTombstoned(reel, deletedUrlSet));

    const scored = visibleReels.map((item) => {
      const sourceType = detectReelSourceType(item.video_url);
      return {
        ...item,
        source_type: sourceType,
        feed_score: Number(scoreReelForGlobalFeed(item).toFixed(3)),
      };
    });

    const mixed = mixSourcesForFeed(scored).map((item) => ({
      ...item,
      id: item._id.toString(),
      _id: undefined,
      __v: undefined,
    }));

    return res.json({ data: mixed });
  } catch (error) {
    console.error('Reel recommendations error:', error);
    return res.status(500).json({ error: 'Failed to fetch reel recommendations.' });
  }
});

app.post('/api/reels/bulk', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser) return res.status(404).json({ error: 'User not found.' });
    if (!['superadmin', 'admin', 'editor', 'author', 'developer'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Permission denied to bulk create reels.' });
    }

    const links = Array.isArray(req.body?.links) ? req.body.links : [];
    const creatorMode = ['official', 'developer', 'anonymous', 'male', 'female'].includes(req.body?.creator_mode)
      ? req.body.creator_mode
      : 'auto';
    if (!links.length) {
      return res.status(400).json({ error: 'links array is required.' });
    }

    const limitedLinks = links
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean)
      .slice(0, 250);

    const invalidLinks = limitedLinks.filter((url) => !isValidHttpUrl(url));
    const normalizedLinks = limitedLinks
      .filter((url) => isValidHttpUrl(url))
      .map((url) => normalizeReelVideoUrl(url));

    const incomingByKey = new Map();
    normalizedLinks.forEach((url) => {
      const key = getVideoDedupKey(url);
      if (!key) return;
      if (!incomingByKey.has(key)) incomingByKey.set(key, url);
    });
    const uniqueIncoming = Array.from(incomingByKey.values());

    const existing = await Reel.find({})
      .select('video_url dedup_key')
      .lean();
    const existingSet = new Set();
    existing.forEach((item) => {
      const key = item.dedup_key || getVideoDedupKey(item.video_url);
      if (key) existingSet.add(key);
    });

    const candidates = uniqueIncoming.filter((url) => {
      const key = getVideoDedupKey(url);
      return key && !existingSet.has(key);
    });

    const deadLinks = [];
    const healthyLinks = [];

    for (const url of candidates) {
      // Keep only links that look playable to avoid repeated buffering/failures in feed.
      const ok = await isLikelyPlayableVideoUrl(url);
      if (ok) healthyLinks.push(url);
      else deadLinks.push(url);
    }

    const created = [];
    for (let i = 0; i < healthyLinks.length; i += 1) {
      const videoUrl = healthyLinks[i];
      const sourceType = detectReelSourceType(videoUrl);
      const dedupKey = getVideoDedupKey(videoUrl);
      const title = `Reel ${Date.now()}-${i + 1}`;
      const baseSlug = slugify(`${sourceType}-${title}`) || `reel-${Date.now()}-${i + 1}`;
      const slug = await findUniqueReelSlug(baseSlug);
      const creatorIdentity = resolveCreatorIdentity({
        payload: { creator_mode: creatorMode, title, video_url: videoUrl },
        currentUser,
        fallbackSeed: `${videoUrl}-${i}`,
      });

      const reel = await Reel.create({
        title,
        slug,
        caption: `Imported ${sourceType} reel`,
        video_url: videoUrl,
        dedup_key: dedupKey,
        cover_image_url: '',
        creator_id: creatorIdentity.creator_id,
        creator_name: creatorIdentity.creator_name,
        creator_handle: creatorIdentity.creator_handle,
        creator_avatar: creatorIdentity.creator_avatar,
        creator_mode: creatorIdentity.creator_mode,
        is_official_creator: creatorIdentity.is_official_creator,
        is_demo_creator: creatorIdentity.is_demo_creator,
        follower_count: creatorIdentity.follower_count,
        tags: [sourceType, 'imported'],
        status: 'published',
        is_active: true,
        published_at: new Date(),
      });
      created.push(reel.toJSON());
    }

    return res.status(201).json({
      data: {
        createdCount: created.length,
        skipped: {
          duplicates: uniqueIncoming.length - candidates.length,
          invalid: invalidLinks.length,
          dead: deadLinks.length,
        },
        deadLinks,
        invalidLinks,
        items: created,
      },
    });
  } catch (error) {
    console.error('Bulk reel import error:', error);
    return res.status(500).json({ error: 'Failed to bulk create reels.' });
  }
});

app.get('/api/reels/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const reel = await Reel.findOneAndUpdate(
      { slug, is_active: true },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!reel) return res.status(404).json({ error: 'Reel not found.' });
    return res.json({ data: reel.toJSON() });
  } catch (error) {
    console.error('Reel detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch reel.' });
  }
});


app.post('/api/reels', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const rawToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  let currentUser = null;

  if (rawToken) {
    try {
      const adminId = await verifyAndGetAdminId(rawToken);
      if (!adminId) {
        return res.status(401).json({ error: 'Invalid token.' });
      }
      currentUser = await Admin.findById(adminId);
      if (!currentUser) {
        return res.status(401).json({ error: 'Invalid token.' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
  }

  console.log('DEBUG: POST /api/reels called, adminId=', currentUser?._id || '(anonymous)');
  console.log('DEBUG: body preview=', JSON.stringify(req.body).slice(0, 1000));
  if (currentUser && !['superadmin', 'admin', 'editor', 'author', 'developer'].includes(currentUser.role)) {
    return res.status(403).json({ error: 'Permission denied to create reels.' });
  }

  const payload = { ...(req.body || {}) };
  if (!payload.video_url) {
    return res.status(400).json({ error: 'video_url required.' });
  }
  if (!payload.creator_mode) {
    payload.creator_mode = currentUser ? 'official' : 'anonymous';
  }
  if (!payload.title || payload.title.trim() === '') {
    payload.title = `Video Story ${new Date().toLocaleDateString('en-IN')}`;
  }

  payload.video_url = normalizeReelVideoUrl(payload.video_url);
  const dedupKey = getVideoDedupKey(payload.video_url);

  const baseSlug = slugify(payload.title) || `reel-${Date.now()}`;
  const slug = await findUniqueReelSlug(baseSlug);
  const creatorIdentity = resolveCreatorIdentity({
    payload,
    currentUser,
    fallbackSeed: `${payload.video_url}-${payload.title}`,
  });

  const reel = await Reel.create({
    title: payload.title,
    slug,
    caption: payload.caption || '',
    video_url: payload.video_url,
    dedup_key: dedupKey,
    cover_image_url: payload.cover_image_url || '',
    creator_id: creatorIdentity.creator_id || currentUser?._id?.toString() || '',
    creator_name: creatorIdentity.creator_name,
    creator_handle: creatorIdentity.creator_handle,
    creator_avatar: creatorIdentity.creator_avatar,
    creator_mode: creatorIdentity.creator_mode,
    is_official_creator: creatorIdentity.is_official_creator,
    is_demo_creator: creatorIdentity.is_demo_creator,
    follower_count: creatorIdentity.follower_count,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    status: payload.status || 'published',
    is_active: true,
    published_at: payload.published_at || new Date(),
  });

  await clearCache('reels');
  const responseData = reel.toJSON();
  responseData.id = responseData.id || responseData._id?.toString();
  
  // Ensure clean ID format in response
  const reelId = reel._id?.toString() || String(reel.id);
  const cleanResponse = {
    id: reelId,
    _id: reelId,
    ...responseData,
  };
  delete cleanResponse.__v;
  
  return res.status(201).json({ data: cleanResponse });
});

// Temporary test route: create a reel without auth (dev only)
app.post('/api/reels/test-create', async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    if (!payload.video_url) payload.video_url = payload.url || '';
    if (!payload.creator_mode) payload.creator_mode = 'anonymous';
    const dedupKey = getVideoDedupKey(payload.video_url || 'test-' + Date.now());
    const baseSlug = slugify(payload.title || `reel-${Date.now()}`) || `reel-${Date.now()}`;
    const slug = await findUniqueReelSlug(baseSlug);
    const creatorIdentity = resolveCreatorIdentity({
      payload,
      currentUser: null,
      fallbackSeed: `${payload.video_url || 'test'}-${payload.title || 'test'}`,
    });

    const reel = await Reel.create({
      title: payload.title || 'Test Reel',
      slug,
      caption: payload.caption || '',
      video_url: payload.video_url || '',
      dedup_key: dedupKey,
      cover_image_url: payload.cover_image_url || '',
      creator_id: creatorIdentity.creator_id,
      creator_name: creatorIdentity.creator_name || 'Test',
      creator_handle: creatorIdentity.creator_handle,
      creator_mode: creatorIdentity.creator_mode,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      status: payload.status || 'published',
      is_active: typeof payload.is_active !== 'undefined' ? payload.is_active : true,
      published_at: payload.published_at || new Date(),
    });
    await clearCache('reels');
    const responseData = reel.toJSON();
    responseData.id = responseData.id || responseData._id?.toString();
    return res.status(201).json({ data: responseData });
  } catch (error) {
    console.error('Test create reel error:', error);
    return res.status(500).json({ error: 'Failed to create test reel.' });
  }
});

app.put('/api/reels/:id', requireAuth, async (req, res) => {
  const currentUser = await Admin.findById(req.adminId);
  if (!currentUser) return res.status(404).json({ error: 'User not found.' });
  if (!['superadmin', 'admin', 'editor'].includes(currentUser.role)) {
    return res.status(403).json({ error: 'Permission denied to update reels.' });
  }

  const { id } = req.params;
  const payload = { ...(req.body || {}) };

  if (payload.video_url) {
    payload.video_url = normalizeReelVideoUrl(payload.video_url);
    payload.dedup_key = getVideoDedupKey(payload.video_url);
  }

  const reel = await Reel.findByIdAndUpdate(id, payload, { new: true });
  if (!reel) return res.status(404).json({ error: 'Reel not found.' });
  
  await clearCache('reels');
  return res.json({ data: reel.toJSON() });
});

app.delete('/api/reels/:id', requireAuth, async (req, res) => {
  const reelId = req.params.id;
  const startTime = Date.now();
  const logs = [];
  
  const log = (msg, type = 'info') => {

    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}`;
    logs.push(logMsg);
    console.log(logMsg);
  };

  try {
    log(`🚀 REEL DELETION START: ${reelId}`);

    const isDeveloperOverride = req.headers['x-developer-secret'] === 'DENCEWANCE_DEV_2026';

    // Permission check
    let currentUser = null;
    if (!isDeveloperOverride) {
      try {
        currentUser = await Admin.findById(req.adminId);
      } catch (err) {
        log(`Warning: Admin.findById failed for id ${req.adminId} - ${err.message}`);
      }
    }
    if (!currentUser) {
      currentUser = { _id: req.adminId, role: isDeveloperOverride ? 'developer' : 'admin' };
    }

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found.' });
    }

    const reelOwnerId = String(reel.creator_id || reel.creatorId || reel.uploaderId || '').trim();
    const reelOwnerHandle = String(reel.creator_handle || '').trim().toLowerCase();
    const currentUserId = String(currentUser._id || req.adminId || '').trim();
    const currentUserHandle = String(currentUser.handle || currentUser.username || currentUser.name || '').trim().toLowerCase();
    const ownsReel = reelOwnerId && reelOwnerId === currentUserId;
    const matchesLegacyIdentity = !reelOwnerId && (reelOwnerHandle && reelOwnerHandle === currentUserHandle);

    if (!isDeveloperOverride && currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && currentUser.role !== 'developer' && !ownsReel && !matchesLegacyIdentity) {
      return res.status(403).json({ error: 'Permission denied to delete this reel.' });
    }

    // Collect all storage references
    const storageUrls = [
      reel.video_url,
      reel.cover_image_url,
      reel.file_url,
      reel.fileUrl,
      reel.video_file_url,
      reel.cover_file_url,
    ].filter(Boolean);

    log(`📦 Found ${storageUrls.length} storage references`);

    // Delete all storage files with our new utility
    const storageResult = await deleteMultipleFiles(storageUrls, {
      retries: 3,
      delay: 300,
      onLog: (msg) => log(`  ${msg}`),
    });

    log(`📊 Storage deletion complete: ${storageResult.deleted}/${storageResult.total} deleted`);
    if (storageResult.results) {
      storageResult.results
        .filter(r => r.deleted === false)
        .forEach(r => {
          log(`  ⚠️ Failed to delete ${r.type} file: ${r.ref}`, 'warn');
        });
    }

      await persistDeletedReelUrls([
        ...storageUrls,
        reelId,
        reel.slug ? `slug:${reel.slug}` : '',
        `id:${reelId}`,
      ]);

    // Delete related records from MongoDB
    const [comments, savedReels] = await Promise.all([
      ReelComment.deleteMany({ reel_id: reelId }),
      SavedReel.deleteMany({ reel_id: reelId }),
    ]);

    log(`🗑️ Deleted ${comments.deletedCount} comments and ${savedReels.deletedCount} saved entries`);

    // Delete from MongoDB
    const deleted = await Reel.findByIdAndDelete(reelId);
    if (!deleted) {
      log(`❌ MongoDB deletion FAILED for reel: ${reelId}`, 'error');
      return res.status(500).json({ error: 'Failed to delete reel from database.' });
    }

    log(`✓ Deleted from MongoDB: ${reelId}`);

    // Clear cache
    await clearCache('reels').catch(e => log(`⚠️ Cache clear failed: ${e.message}`));
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    log(`✅ REEL DELETION COMPLETE in ${duration}s`);

    return res.json({
      success: true,
      message: 'Reel permanently deleted from all sources.',
      data: {
        reelId,
        duration: `${duration}s`,
        storage: {
          total: storageResult.total,
          deleted: storageResult.deleted,
          failed: storageResult.failed,
          byType: storageResult.summary,
        },
        database: {
          comments: comments.deletedCount,
          saved: savedReels.deletedCount,
        },
        logs: logs.slice(-20), // Last 20 logs
      },
    });
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    log(`❌ DELETION ERROR after ${duration}s: ${error.message}`, 'error');
    return res.status(500).json({
      error: 'Failed to delete reel.',
      message: error?.message,
      logs: logs.slice(-10),
    });
  }
});

app.post('/api/admin/reels/permanent-cleanup', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || currentUser.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can run permanent cleanup.' });
    }

    const reelId = String(req.body?.reelId || req.body?.id || '').trim();
    const reelUrl = String(req.body?.videoUrl || req.body?.video_url || '').trim();
    if (!reelId && !reelUrl) {
      return res.status(400).json({ error: 'reelId or videoUrl required.' });
    }

    const reel = reelId ? await Reel.findById(reelId) : await Reel.findOne({ video_url: normalizeReelVideoUrl(reelUrl) });
    const storageTargets = new Set();
    if (reel) {
      [reel.video_url, reel.cover_image_url, reel.file_url, reel.fileUrl, reel.video_file_url, reel.cover_file_url]
        .filter(Boolean)
        .forEach((value) => storageTargets.add(value));
    }
    if (reelUrl) storageTargets.add(normalizeReelVideoUrl(reelUrl));

    const storageResults = await deleteMultipleFiles([...storageTargets], { retries: 2, delay: 200, onLog: () => {} });

    if (reel) {
      await Promise.all([
        ReelComment.deleteMany({ reel_id: reel._id.toString() }),
        SavedReel.deleteMany({ reel_id: reel._id.toString() }),
      ]);
      await Reel.findByIdAndDelete(reel._id.toString());
      await purgeDeletedReelMarkers([
        ...storageTargets,
        reel._id.toString(),
        reel.slug ? `slug:${reel.slug}` : '',
        `id:${reel._id.toString()}`,
      ]);
    } else {
      await purgeDeletedReelMarkers([
        ...storageTargets,
        reelId,
        reelUrl,
      ]);
    }

    await clearCache('reels');
    return res.json({
      success: true,
      message: 'Permanent cleanup completed.',
      data: {
        reelId,
        reelUrl,
        storageDeleted: storageResults?.deleted || 0,
      },
    });
  } catch (error) {
    console.error('Permanent cleanup error:', error);
    return res.status(500).json({ error: 'Permanent cleanup failed.', detail: error?.message || error });
  }
});

app.post('/api/admin/reels/backfill-creator-ids', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const reels = await Reel.find({}).lean();
    let updated = 0;
    let alreadyComplete = 0;

    for (const reel of reels || []) {
      if (reel.creator_id && String(reel.creator_id).trim()) {
        alreadyComplete += 1;
        continue;
      }

      const identity = resolveCreatorIdentity({
        payload: {
          creator_mode: reel.creator_mode || 'anonymous',
          creator_id: reel.creator_id || reel.creatorId || reel.uploaderId || '',
          creator_name: reel.creator_name || reel.custom_author_name || '',
          creator_handle: reel.creator_handle || '',
          creator_avatar: reel.creator_avatar || '',
          title: reel.title || '',
          video_url: reel.video_url || '',
        },
        currentUser: null,
        fallbackSeed: `${reel._id || reel.id || reel.slug || reel.title || reel.video_url || 'reel'}`,
      });

      await Reel.findByIdAndUpdate(reel._id || reel.id, {
        creator_id: identity.creator_id,
        creator_name: identity.creator_name,
        creator_handle: identity.creator_handle,
        creator_avatar: identity.creator_avatar,
        creator_mode: identity.creator_mode,
        is_official_creator: identity.is_official_creator,
        is_demo_creator: identity.is_demo_creator,
        follower_count: identity.follower_count,
      });
      updated += 1;
    }

    await clearCache('reels');
    return res.json({
      success: true,
      data: {
        updated,
        alreadyComplete,
        total: reels.length,
      },
    });
  } catch (error) {
    console.error('Backfill creator IDs error:', error);
    return res.status(500).json({ error: 'Failed to backfill creator IDs.' });
  }
});

app.post('/api/news', requireAuth, async (req, res) => {
  const currentUser = await Admin.findById(req.adminId);
  if (!currentUser) return res.status(404).json({ error: 'User not found.' });
  if (!['superadmin', 'admin', 'editor', 'author', 'developer'].includes(currentUser.role)) {
    return res.status(403).json({ error: 'Permission denied to create news.' });
  }

  const payload = { ...(req.body || {}) };
  if (currentUser.role === 'author') {
    payload.status = 'draft';
    payload.is_featured = 0;
    payload.is_breaking = 0;
  }

  if (!payload.title || !payload.excerpt || !payload.content) {
    return res.status(400).json({ error: 'Title, excerpt, and content required.' });
  }

  if (payload.creator_mode === 'official' || !payload.creator_mode) {
    payload.author_id = currentUser._id.toString();
    payload.author_name = payload.custom_author_name || currentUser.name;
    payload.source = currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.author_name)}&background=random`; // official icon/avatar
  } else if (payload.creator_mode === 'developer') {
    payload.author_id = payload.creator_id || `dev_${Date.now()}`;
    payload.author_name = payload.custom_author_name || payload.creator_name || 'Developer';
    payload.source = payload.creator_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.author_name)}&background=random`;
  } else if (payload.creator_mode === 'anonymous') {
    payload.author_id = payload.creator_id || `anon_${Date.now()}`;
    payload.author_name = payload.custom_author_name || payload.creator_name || 'Anonymous Scriptor';
    payload.source = `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.author_name)}&background=random`;
  } else if (payload.creator_mode === 'male') {
    payload.author_id = payload.creator_id || `male_${Date.now()}`;
    payload.author_name = payload.custom_author_name || 'Dencewance User';
    payload.source = payload.creator_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.author_name)}&background=random`;
  } else if (payload.creator_mode === 'female') {
    payload.author_id = payload.creator_id || `female_${Date.now()}`;
    payload.author_name = payload.custom_author_name || 'Dencewance User';
    payload.source = payload.creator_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.author_name)}&background=random`;
  }

  const baseSlug = slugify(payload.title);
  const slug = await findUniqueSlug(baseSlug);

  const readingTime = getReadingTime(payload.content);

  try {
    const news = await News.create({
      ...payload,
      slug,
      reading_time: readingTime,
      category: payload.category || 'कैंपस',
      status: payload.status || 'published',
      language: payload.language || 'hi',
      priority: payload.priority || 'normal',
    });
      await clearCache("news"); return res.status(201).json({ data: news.toJSON() });
  } catch (error) {
    console.error("Error inserting news:", error);
    return res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

app.put('/api/news/:id', requireAuth, async (req, res) => {
  const currentUser = await Admin.findById(req.adminId);
  if (!currentUser) return res.status(404).json({ error: 'User not found.' });
  if (!['superadmin', 'admin', 'editor', 'author', 'developer'].includes(currentUser.role)) {
    return res.status(403).json({ error: 'Permission denied to update news.' });
  }

  const { id } = req.params;
  const payload = { ...(req.body || {}) };
  if (currentUser.role === 'author') {
    payload.status = 'draft';
    payload.is_featured = 0;
    payload.is_breaking = 0;
  }

  if (payload.content) {
    payload.reading_time = getReadingTime(payload.content);
  }

  try {
    const existing = await News.findByIdAndUpdate(id, payload, { new: true });
    if (!existing) return res.status(404).json({ error: 'News not found.' });
      await clearCache('news');
    return res.json({ data: existing.toJSON() });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: 'Update Failed: ' + error.message });
  }
});

app.delete('/api/news/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let currentUser = await Admin.findById(req.adminId);
    if (!currentUser) {
      // Fallback for appwrite users without Admin records
      currentUser = { _id: req.adminId, role: 'admin' };
    }
    
    // Check ownership
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ error: 'News not found.' });

    // admin role can delete anything, others can only delete their own posts
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && news.author_id !== currentUser._id.toString()) {
      return res.status(403).json({ error: 'Permission denied to delete this news.' });
    }

    await News.findByIdAndDelete(id);
      await clearCache('news');
    return res.status(204).send();
  } catch (error) {
    console.error('News delete error:', error);
    return res.status(500).json({ error: 'Failed to delete news.' });
  }
});

app.post('/api/uploads/cover', requireAuth, upload.single('cover'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  try {
    if (useOfflineFallback) {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = path.extname(req.file.originalname || '') || '.png';
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, fileName), req.file.buffer);
      const publicUrl = `/uploads/${fileName}`;
      return res.json({ 
        data: { 
          url: publicUrl,
          original_name: req.file.originalname,
          size: req.file.size
        } 
      });
    }

    // If using R2, file is already uploaded by multer-s3
    if (hasR2Config && req.file.key) {
      const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${req.file.key}` : req.file.location;
      return res.json({ 
        data: { 
          url: publicUrl,
          original_name: req.file.originalname,
          size: req.file.size
        } 
      });
    }

    const appwriteFile = await appwriteStorage.createFile(
      APPWRITE_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(req.file.buffer, req.file.originalname || 'media-file')
    );
    const publicUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, appwriteFile.$id);
    return res.json({
      data: {
        url: publicUrl,
        original_name: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload cover image' });
  }
});

app.post('/api/uploads/media', (req, res, next) => {
  upload.single('media')(req, res, (err) => {
    if (err) {
      console.error('Media Multer/S3 Upload Error:', err);
      return res.status(500).json({ error: 'Media Upload Failed: ' + (err.message || 'Check R2 credentials') });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No media file uploaded.' });

  try {
    if (useOfflineFallback) {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = path.extname(req.file.originalname || '') || '.mp4';
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, fileName), req.file.buffer);
      const publicUrl = `/uploads/${fileName}`;
      return res.json({
        data: {
          url: publicUrl,
          original_name: req.file.originalname,
          size: req.file.size
        }
      });
    }

    // If using R2, file is already uploaded by multer-s3
    if (hasR2Config && (req.file.location || req.file.key)) {
      const publicUrl = R2_PUBLIC_URL && req.file.key ? `${R2_PUBLIC_URL}/${req.file.key}` : req.file.location;
      return res.json({
        data: {
          url: publicUrl,
          original_name: req.file.originalname,
          size: req.file.size
        }
      });
    }

    const appwriteFile = await appwriteStorage.createFile(
      APPWRITE_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(req.file.buffer, req.file.originalname || 'media-file')
    );
    const publicUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, appwriteFile.$id);
    return res.json({
      data: {
        url: publicUrl,
        original_name: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload media file' });
  }
});

// ── Sign a direct R2 upload (browser → R2, bypasses Vercel payload limit) ──
app.post('/api/uploads/sign', async (req, res) => {
  if (!hasR2Config) {
    return res.status(503).json({ error: 'R2 not configured on this server.' });
  }
  
  try {
    const { filename, contentType } = req.body;
    
    // Fallbacks just in case
    const timestamp = Date.now();
    const ext = filename ? filename.split('.').pop() : 'mp4';
    const key = `users/media/${timestamp}-${Math.round(Math.random() * 1e9)}.${ext}`;
    
    // We get back { uploadUrl, publicUrl }
    const signData = await generatePresignedUrl(key, contentType || 'video/mp4');
    
    return res.json({
      uploadUrl: signData.uploadUrl,
      publicUrl: signData.publicUrl,
      data: {
        timestamp: Math.round(timestamp / 1000),
        folder: 'users/media',
        resource_type: 'video',
      },
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// ── Cleanup: delete all reels with base64/blob video_urls (junk data before Cloudinary) ──

// --- PYQ Admin API ---

// --- PYQ Data API ---
const normalizePYQDocument = (document) => ({
  ...document,
  fileId: Array.isArray(document.fileId) ? (document.fileId[0] || '') : (document.fileId || ''),
  uploaderId: Array.isArray(document.uploaderId) ? (document.uploaderId[0] || '') : (document.uploaderId || ''),
  cover_url: Array.isArray(document.cover_url) ? (document.cover_url[0] || null) : (document.cover_url || null)
});

app.get('/api/pyq', async (req, res) => {
  try {
    const documents = await Pyq.find().sort({ created_at: -1 }).limit(100);
    res.json({ success: true, data: documents.map(d => normalizePYQDocument(d.toJSON ? d.toJSON() : d)) });
  } catch (err) {
    console.error("PYQ List Error:", err);
    res.status(500).json({ error: 'Failed to fetch PYQ documents.' });
  }
});

const normalizePYQFileType = (mimeType) => {
  if (!mimeType || typeof mimeType !== 'string') return 'pdf';
  const mimeStr = mimeType.toLowerCase();
  if (mimeStr.includes('pdf')) return 'pdf';
  if (mimeStr.includes('word') || mimeStr.includes('document')) return 'doc';
  if (mimeStr.includes('powerpoint') || mimeStr.includes('presentation')) return 'ppt';
  if (mimeStr.includes('excel') || mimeStr.includes('spreadsheet')) return 'xls';
  if (mimeStr.includes('text')) return 'txt';
  return mimeStr.split('/')[0] || 'pdf';
};

app.post('/api/pyq', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Only admins can insert PYQ documents.' });
    }
    // Validate required fields for PYQ
    const requiredFields = ['dept', 'course', 'subject', 'fileName', 'fileId'];
    const missingFields = requiredFields.filter(f => !req.body[f]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: 'Missing required fields: ' + missingFields.join(', ') });
    }
    
    try {
      const payload = {
        ...req.body,
        fileId: Array.isArray(req.body.fileId) ? req.body.fileId.filter(Boolean) : [req.body.fileId].filter(Boolean),
        uploaderId: Array.isArray(req.body.uploaderId)
          ? req.body.uploaderId.filter(Boolean)
          : [req.body.uploaderId].filter(Boolean),
        cover_url: Array.isArray(req.body.cover_url)
          ? req.body.cover_url.filter(Boolean)
          : [req.body.cover_url].filter(Boolean),
        fileType: req.body.fileType || normalizePYQFileType(req.body.mimeType || req.body.contentType || '')
      };
      const result = await Pyq.create(payload);
      res.json({ success: true, data: normalizePYQDocument(result.toJSON ? result.toJSON() : result) });
    } catch (err) {
      // Log full error details for debugging
      console.error("PYQ Insert Error (Appwrite):", err);
      let errorMsg = 'Failed to insert PYQ document.';
      if (err && err.message) errorMsg += ' ' + err.message;
      if (err && err.code) errorMsg += ' (code: ' + err.code + ')';
      if (err && err.response) errorMsg += ' ' + JSON.stringify(err.response);
      res.status(500).json({ error: errorMsg });
    }
  } catch (err) {
    // Log unexpected errors
    console.error("PYQ Insert Error (Unexpected):", err);
    res.status(500).json({ error: 'Unexpected error: ' + (err && err.message ? err.message : err) });
  }
});

app.post('/api/pyq/upload', requireAuth, packetUpload.single('file'), async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && currentUser.role !== 'developer')) {
      return res.status(403).json({ error: 'Only admins and developers can upload PYQ documents.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'file required.' });
    }

    const { dept, course, subject, keywords = '' } = req.body || {};
    const missingFields = ['dept', 'course', 'subject'].filter((f) => !req.body?.[f]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: 'Missing required fields: ' + missingFields.join(', ') });
    }

    // Prefer R2 storage. Fall back to Appwrite storage so uploads still work
    // when R2 is not configured or temporarily unavailable.
    let fileUrl = '';
    let storedFileId = '';
    if (useOfflineFallback) {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = req.file.originalname ? req.file.originalname.split('.').pop() : 'bin';
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      fs.writeFileSync(path.join(uploadsDir, fileName), req.file.buffer);
      fileUrl = `/uploads/${fileName}`;
      storedFileId = fileName;
    } else if (hasR2Config) {
      try {
        const timestamp = Date.now();
        const ext = req.file.originalname ? req.file.originalname.split('.').pop() : 'bin';
        const key = `users/pyq/${timestamp}-${Math.round(Math.random() * 1e9)}.${ext}`;
        const signData = await generatePresignedUrl(key, req.file.mimetype || 'application/octet-stream');
        await fetch(signData.uploadUrl, { method: 'PUT', body: req.file.buffer, headers: { 'content-type': req.file.mimetype || 'application/octet-stream' } });
        fileUrl = signData.publicUrl;
      } catch (uploadErr) {
        console.warn('PYQ R2 upload failed, falling back to Appwrite:', uploadErr?.message || uploadErr);
      }
    }

    if (!fileUrl && !useOfflineFallback) {
      const appwriteFile = await uploadPyqToAppwrite(req.file.buffer, req.file.originalname, req.file.mimetype || req.file.contentType || req.file.type || 'application/octet-stream');
      fileUrl = appwriteFile.url;
      storedFileId = appwriteFile.id;
    }

    const uploaderId = String(currentUser._id || req.adminId || '').trim();

    const payload = {
      dept: String(dept).toUpperCase(),
      course: String(course).toUpperCase(),
      subject: keywords ? `${subject} //SEO// ${keywords}` : subject,
      fileName: req.file.originalname,
      fileType: normalizePYQFileType(req.file.mimetype || req.file.contentType || req.file.type || ''),
      fileId: [storedFileId || fileUrl],
      uploaderId: uploaderId ? [uploaderId] : [],
      cover_url: fileUrl ? [fileUrl] : [],
    };

    const doc = await Pyq.create(payload);
    return res.status(201).json({ success: true, data: doc, file: { id: null, url: fileUrl } });
  } catch (err) {
    console.error('PYQ Multipart Upload Error:', err);
    return res.status(500).json({ error: 'Failed to upload PYQ packet.' });
  }
});

app.delete('/api/pyq/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { fileId } = req.query;
    const currentUser = await Admin.findById(req.adminId);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Only admins can delete PYQ documents.' });
    }

    if (fileId) {
      try {
        const viewUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, fileId);
        await deleteStoredMedia(viewUrl, { onLog: (m) => console.log(m) });
      } catch(e) {
        console.warn("Could not delete from storage:", e.message);
      }
    }
    
    await Pyq.findByIdAndDelete(id);
    res.json({ success: true, message: 'PYQ document deleted.' });
  } catch(err) {
    console.error("PYQ Delete Error:", err);
    res.status(500).json({ error: 'Failed to delete PYQ document from Appwrite.' });
  }
});

app.delete('/api/reels/cleanup-junk', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    // Find all reels with local/base64/blob video_url
    const junkReels = await Reel.find({
      $or: [
        { video_url: /^data:/ },           // base64 encoded
        { video_url: /^blob:/ },           // blob URL (useless server-side)
        { video_url: /^local-/ },          // local temp ids
        { video_url: '' },                 // empty video
      ]
    }).lean();

    if (junkReels.length === 0) {
      return res.json({ data: { deleted: 0, message: 'No junk reels found.' } });
    }

    // Attempt to delete each from Cloudinary if public_id is traceable
    const deletedIds = junkReels.map(r => r._id);
    await Reel.deleteMany({ _id: { $in: deletedIds } });

    return res.json({
      data: {
        deleted: junkReels.length,
        titles: junkReels.map(r => r.title),
        message: `${junkReels.length} junk reel(s) cleaned from database.`,
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ error: 'Cleanup failed: ' + error.message });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await SiteSettings.findOne();
    if (!settings) return res.json({ data: null });
    return res.json({ data: settings.toJSON() });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

app.put('/api/settings', requireAuth, async (req, res) => {
  const payload = req.body || {};
  const existingSettings = await SiteSettings.find().sort({ created_at: -1 }).limit(1);
  let settings = existingSettings[0] || null;

  if (!settings) {
    settings = await SiteSettings.create(payload);
  } else {
    Object.assign(settings, payload);
    await settings.save();
  }
  return res.json({ data: settings.toJSON() });
});

// Storage usage summary (Appwrite R2 and DB counts) - ADMIN ONLY
app.get('/api/storage/usage', requireAuth, async (req, res) => {
  // Verify user is admin
  const adminId = req.adminId || req.userId;
  if (!adminId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const admin = await Admin.findById(adminId);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
  } catch (err) {
    console.warn('Admin check failed:', err);
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const usage = { appwrite: null, r2: null, dbCounts: null };

    // Appwrite bucket usage (if API key present)
    try {
      if (process.env.APPWRITE_API_KEY) {
        const BUCKET_ID = APPWRITE_BUCKET_ID;
        const listRes = await appwriteStorage.listFiles(BUCKET_ID);
        let files = [];
        if (Array.isArray(listRes.files)) files = listRes.files;
        else if (Array.isArray(listRes.documents)) files = listRes.documents;
        else if (Array.isArray(listRes)) files = listRes;

        const totalFiles = files.length;
        const totalBytes = files.reduce((s, f) => s + (Number(f.size) || Number(f.$size) || 0), 0);
        usage.appwrite = { available: true, bucket: BUCKET_ID, totalFiles, totalBytes };
      } else {
        usage.appwrite = { available: false, reason: 'APPWRITE_API_KEY not configured' };
      }
    } catch (err) {
      console.warn('Appwrite usage check failed:', err?.message || err);
      usage.appwrite = { available: false, reason: 'failed to query Appwrite' };
    }

    // R2 usage
    try {
      if (hasR2Config && s3Client) {
        const files = await listAllR2Files();
        const totalFiles = Array.isArray(files) ? files.length : 0;
        const totalBytes = (files || []).reduce((s, f) => s + (Number(f.size) || 0), 0);
        usage.r2 = { available: true, bucket: R2_BUCKET_NAME, totalFiles, totalBytes };
      } else {
        usage.r2 = { available: false, reason: 'R2 not configured' };
      }
    } catch (err) {
      console.warn('R2 usage check failed:', err?.message || err);
      usage.r2 = { available: false, reason: 'failed to query R2' };
    }

    // DB counts (sample counts for collections)
    try {
      const newsList = await News.find().limit(1).then(r => r || []);
      const reelsList = await Reel.find().limit(1).then(r => r || []);
      const pyqList = await (async () => {
        const { Query } = require('node-appwrite');
        const result = await appwriteDatabases.listDocuments('69d60fe8000c9bd92750', 'pyq', [Query.limit(100)]);
        return result.documents || [];
      })();

      usage.dbCounts = {
        newsSample: Array.isArray(newsList) ? newsList.length : 0,
        reelsSample: Array.isArray(reelsList) ? reelsList.length : 0,
        pyqSample: Array.isArray(pyqList) ? pyqList.length : 0,
      };
    } catch (err) {
      console.warn('DB counts check failed:', err?.message || err);
      usage.dbCounts = null;
    }

    return res.json({ success: true, data: usage });
  } catch (err) {
    console.error('Storage usage endpoint error:', err);
    return res.status(500).json({ success: false, error: 'Failed to calculate storage usage' });
  }
});

app.get('/api/admin/setup-db', async (req, res) => {
  try {
    const { databases, APPWRITE_DB_ID } = await import('./appwrite.js');
    
    // Create missing attributes on admins
    const adminAttrs = [
      { key: 'username', size: 255 },
      { key: 'bio', size: 1000 },
      { key: 'avatar_url', size: 2048 },
      { key: 'name', size: 255 }
    ];

    const results = [];
    for (const attr of adminAttrs) {
      try {
        await databases.createStringAttribute(APPWRITE_DB_ID, 'admins', attr.key, attr.size, false, '', false);
        results.push(`Created admins.${attr.key}`);
      } catch (err) {
        results.push(`Skipped admins.${attr.key} (${err.message})`);
      }
    }
    
    // Reels
    const reelAttrs = [
      { key: 'creator_handle', size: 255 },
      { key: 'creator_avatar', size: 2048 }
    ];

    for (const attr of reelAttrs) {
      try {
        await databases.createStringAttribute(APPWRITE_DB_ID, 'reels', attr.key, attr.size, false, '', false);
        results.push(`Created reels.${attr.key}`);
      } catch (err) {
        results.push(`Skipped reels.${attr.key} (${err.message})`);
      }
    }

    // Interactions
    try {
      await databases.createCollection(APPWRITE_DB_ID, 'interactions', 'Interactions');
      results.push('Created interactions collection');
    } catch (err) {
      results.push(`Skipped interactions collection (${err.message})`);
    }

    const intAttrs = [
      { key: 'user_id', size: 255 },
      { key: 'target_id', size: 255 },
      { key: 'target_type', size: 50 },
      { key: 'type', size: 50 },
      { key: 'created_at', size: 255 }
    ];

    for (const attr of intAttrs) {
      try {
        await databases.createStringAttribute(APPWRITE_DB_ID, 'interactions', attr.key, attr.size, false, '', false);
        results.push(`Created interactions.${attr.key}`);
      } catch (err) {
        results.push(`Skipped interactions.${attr.key} (${err.message})`);
      }
    }

    // Follows
    try {
      await databases.createCollection(APPWRITE_DB_ID, 'follows', 'Follows');
      results.push('Created follows collection');
    } catch (err) {
      results.push(`Skipped follows collection (${err.message})`);
    }

    const followAttrs = [
      { key: 'follower_id', size: 255 },
      { key: 'following_id', size: 255 },
      { key: 'created_at', size: 255 }
    ];

    for (const attr of followAttrs) {
      try {
        await databases.createStringAttribute(APPWRITE_DB_ID, 'follows', attr.key, attr.size, false, '', false);
        results.push(`Created follows.${attr.key}`);
      } catch (err) {
        results.push(`Skipped follows.${attr.key} (${err.message})`);
      }
    }

    res.json({ success: true, results });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin DB Cleanup tool: Rewrites empty/alok creator_name values to the superadmin profile
app.get('/api/admin/clean-names', requireAuth, async (req, res) => {
  try {
    const adminId = req.adminId || req.userId;
    const admin = await Admin.findById(adminId);
    if (!admin || admin.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin access required' });
    }

    const setOps = { 
      creator_name: admin.name,
      creator_handle: admin.username || admin.email.split('@')[0],
      creator_avatar: admin.avatar_url,
      creator_id: admin._id?.toString() || admin.id?.toString()
    };

    let modifiedReels = 0;
    
    // Manually loop through reels and update because updateMany is not supported by our Appwrite mock
    const allReels = await Reel.find();
    for (const reel of allReels) {
      const name = String(reel.creator_name || '');
      const handle = String(reel.creator_handle || '');
      if (!name || name === 'Admin' || name.toLowerCase().includes('alok') || handle.toLowerCase().includes('alok')) {
        Object.assign(reel, setOps);
        await reel.save();
        modifiedReels++;
      }
    }

    return res.json({ 
      success: true, 
      message: 'Old records cleaned successfully', 
      modifiedCount: modifiedReels
    });
  } catch (err) {
    console.error('Clean DB error:', err);
    return res.status(500).json({ error: 'DB Cleanup failed: ' + err.message });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled route error:', err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

// In-memory active visitors tracking
const activeVisitors = new Map();

app.post('/api/stats/ping', async (req, res) => {
  try {
    const visitorId = req.body.visitorId || req.ip || 'anonymous';
    const isNewSession = req.body.isNewSession === true;
    
    // Track active visitor (expires after 15s of no ping)
    activeVisitors.set(visitorId, Date.now());
    
    // Clean up old visitors
    const threshold = Date.now() - 15000;
    for (const [key, lastSeen] of activeVisitors.entries()) {
      if (lastSeen < threshold) activeVisitors.delete(key);
    }
    
    // Increment total views if it's a new session
    let settings = await SiteSettings.findOne() || await SiteSettings.create({});
    
    if (isNewSession) {
      settings.total_views = (settings.total_views || 0) + 1;
      await settings.save();
    }
    
    res.json({
      liveVisitors: Math.max(1, activeVisitors.size),
      totalViews: settings.total_views || 0
    });
  } catch (error) {
    console.error('Stats ping error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// --- ADVANCED FEATURES: Profiles, Comments, Saved Reels ---


// Get or Create generic test profile for simplified integration
app.post('/api/profile/test-login', async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ email: 'test@example.com' });
    if (!profile) {
      profile = await UserProfile.create({
        name: 'Test Viewer',
        handle: '@testviewer',
        email: 'test@example.com',
        avatar_url: 'https://ui-avatars.com/api/?name=Test+Viewer'
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Independent Comments for a specific video reel
app.get('/api/reels/:id/comments', async (req, res) => {
  try {
    const comments = await ReelComment.find({ reel_id: req.params.id })
      .sort({ created_at: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new Independent Comment 
app.post('/api/reels/:id/comments', async (req, res) => {
  try {
    const { user_id, author_name, author_handle, author_avatar, text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const payload = {
      reel_id: req.params.id,
      user_id: user_id || '60c72b2f9b1d8e4b88a91b2c', // Fallback objectId for test
      author_name: author_name || 'Anonymous',
      author_handle: author_handle || '@anonymous',
      text: text.trim()
    };
    
    if (author_avatar && typeof author_avatar === 'string' && author_avatar.trim() !== '') {
      payload.author_avatar = author_avatar.trim();
    }

    const newComment = await ReelComment.create(payload);
    
    if (!newComment) {
      return res.status(500).json({ error: 'Database failed to save the comment. Please try again later.' });
    }

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle Save/Bookmark for a Reel
// Modern Interactions API (Likes & Saves)
app.post('/api/interactions/:type', requireAuth, async (req, res) => {
  try {
    const { target_id, target_type } = req.body;
    const type = req.params.type; // 'like' or 'save'
    const userId = req.adminId;

    if (!['like', 'save', 'share'].includes(type)) {
      return res.status(400).json({ error: 'Invalid interaction type' });
    }
    if (!target_id || !target_type) {
      return res.status(400).json({ error: 'Missing target_id or target_type' });
    }

    const existing = await Interaction.findOne({ user_id: userId, target_id, type });
    
    // Toggle logic
    if (existing) {
      await existing.deleteOne();
      
      // Update counts based on target
      if (target_type === 'reel') {
        const reel = await Reel.findById(target_id);
        if (reel) {
          reel[type === 'like' ? 'likes' : 'saves'] = Math.max(0, (reel[type === 'like' ? 'likes' : 'saves'] || 0) - 1);
          await reel.save();
        }
      }
      return res.json({ active: false, message: `${type} removed.` });
    } else {
      await Interaction.create({
        user_id: userId,
        target_id,
        target_type,
        type,
        created_at: new Date().toISOString()
      });

      if (target_type === 'reel') {
        const reel = await Reel.findById(target_id);
        if (reel) {
          reel[type === 'like' ? 'likes' : 'saves'] = (reel[type === 'like' ? 'likes' : 'saves'] || 0) + 1;
          await reel.save();
        }
      }
      return res.json({ active: true, message: `${type} added.` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modern Follow API
app.post('/api/users/:id/follow', requireAuth, async (req, res) => {
  try {
    const followingId = req.params.id;
    const followerId = req.adminId;

    if (followingId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existing = await Follow.findOne({ follower_id: followerId, following_id: followingId });
    
    if (existing) {
      await existing.deleteOne();
      
      const adminToUnfollow = await Admin.findById(followingId);
      if (adminToUnfollow) {
        adminToUnfollow.followers_count = Math.max(0, (adminToUnfollow.followers_count || 0) - 1);
        await adminToUnfollow.save();
      }

      const currentUser = await Admin.findById(followerId);
      if (currentUser) {
        currentUser.following_count = Math.max(0, (currentUser.following_count || 0) - 1);
        await currentUser.save();
      }

      return res.json({ following: false, message: 'Unfollowed user.' });
    } else {
      await Follow.create({
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString()
      });

      const adminToFollow = await Admin.findById(followingId);
      if (adminToFollow) {
        adminToFollow.followers_count = (adminToFollow.followers_count || 0) + 1;
        await adminToFollow.save();
      }

      const currentUser = await Admin.findById(followerId);
      if (currentUser) {
        currentUser.following_count = (currentUser.following_count || 0) + 1;
        await currentUser.save();
      }

      return res.json({ following: true, message: 'Followed user.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy fallback routes for frontend compatibility (will redirect logic)
app.post('/api/reels/:id/save', requireAuth, async (req, res) => {
  req.body.target_id = req.params.id;
  req.body.target_type = 'reel';
  req.params.type = 'save';
  return app._router.handle(req, res, () => {});
});

app.post('/api/reels/:id/like', requireAuth, async (req, res) => {
  req.body.target_id = req.params.id;
  req.body.target_type = 'reel';
  req.params.type = 'like';
  return app._router.handle(req, res, () => {});
});

app.get('/api/reels/:id/liked-by/:userId', async (req, res) => {
  try {
    const existing = await Interaction.findOne({ user_id: req.params.userId, target_id: req.params.id, type: 'like' });
    const reel = await Reel.findById(req.params.id);
    return res.json({ liked: !!existing, likes: reel?.likes || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a comment
app.delete('/api/reels/:reelId/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const comment = await ReelComment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only admin or comment author can delete
    const requester = await Admin.findById(req.adminId);
    const requesterRole = requester?.role;
    const isAdmin = requesterRole === 'admin' || requesterRole === 'superadmin';
    const ownsComment = String(req.adminId) === String(comment.user_id) || String(req.adminId) === String(comment.$id);

    if (!isAdmin && !ownsComment) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await ReelComment.findByIdAndDelete(req.params.commentId);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get public user profile by ID or handle
app.get('/api/users/:userHandle', async (req, res) => {
  try {
    const handle = req.params.userHandle;
    
    let user = await Admin.findById(handle);
    if (!user) {
      user = await Admin.findOne({ email: handle });
    }
    if (!user) {
      // Try to find from custom creator_id or creator_handle field
      let reels = await Reel.find({ creator_id: handle }).limit(1);
      if (reels.length === 0) {
        reels = await Reel.find({ creator_handle: handle }).limit(1);
      }
      if (reels.length > 0) {
        return res.json({
          id: reels[0].creator_id || handle,
          name: reels[0].creator_name || 'User',
          handle: reels[0].creator_handle || handle,
          avatar_url: reels[0].creator_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(reels[0].creator_name || handle),
          bio: `Creator on DenceWance`,
          followers: reels[0].followers_count || 0,
          following: reels[0].following_count || 0,
          verified: false
        });
      }
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      handle: user.email?.split('@')[0] || handle,
      avatar_url: user.avatar_url || '',
      bio: user.bio || '',
      followers: user.followers_count || 0,
      following: user.following_count || 0,
      verified: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's reels and posts
app.get('/api/users/:userId/content', async (req, res) => {
  try {
    const userId = req.params.userId;

    const reels = await Reel.find({ creator_id: userId }).sort({ published_at: -1 }).limit(50);
    const posts = await News.find({ author_id: userId }).sort({ published_at: -1 }).limit(50);

    res.json({
      reels: reels || [],
      posts: posts || [],
      totalReels: reels?.length || 0,
      totalPosts: posts?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- SYNC MANUAL R2 UPLOADS ---
// Keep this admin-only and explicit so deleted reels do not silently reappear.
app.post('/api/reels/sync-r2', requireAuth, async (req, res) => {
  try {
    if (!hasR2Config) {
      return res.status(400).json({ error: 'R2 is not configured' });
    }
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Admin permission required for R2 sync.' });
    }

    const files = await listAllR2Files();
    if (!files || files.length === 0) {
      return res.json({ message: 'No files found in R2' });
    }

    const deletedUrlSet = await getDeletedReelUrlSet();
    
    let added = 0;
    for (const file of files) {
      if (file.key.match(/\.(mp4|webm|mov)$/i)) {
        const fileCandidates = reelUrlCandidates(file.publicUrl);
        if (fileCandidates.some((candidate) => deletedUrlSet.has(candidate))) continue;
        const existing = await Reel.findOne({ video_url: file.publicUrl });
        if (!existing) {
          const title = file.key.replace(/\.(mp4|webm|mov)$/i, '').replace(/[-_]/g, ' ');
          const slugText = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random()*10000);
          
          await Reel.create({
            title: title || 'R2 Story',
            slug: slugText,
            video_url: file.publicUrl,
            caption: 'Manual upload from R2',
            is_active: true,
            status: 'published',
            creator_id: currentUser._id.toString(),
            creator_name: 'Admin',
            creator_handle: 'admin',
            creator_mode: 'admin',
            published_at: file.lastModified || new Date(),
            created_at: file.lastModified || new Date()
          });
          added++;
        }
      }
    }
    
    res.json({ success: true, message: `Synced R2 files to reels endpoint`, total_found: files.length, added_new: added });
  } catch (error) {
    console.error('R2 sync error:', error);
    res.status(500).json({ error: error.message });
  }
});
// --- STATUS (STORIES ON MAIN PAGE) ---

// ============================================================================
// GLOBAL VIRAL CONNECTIVITY ALGORITHM (GVCA) FOR LATEST STATUS
// ============================================================================
// Algorithm Patent: Calculates viral coefficient based on interaction velocity,
// audience reach (followers), and time-decay factor.
// Formula: Score = ((Views) + (Likes * 3) + (Shares * 5) + (Followers * 0.05)) / ((Age_In_Hours) + 2)^1.8
app.get('/api/global-status', async (req, res) => {
  try {
    const reels = await Reel.find({ is_active: true }).lean();
    const deletedUrlSet = await getDeletedReelUrlSet();
    const visibleReels = reels.filter((reel) => !isReelTombstoned(reel, deletedUrlSet));
    const populated = await populateCreatorDetails(visibleReels, 'creator_id', 'creator_name', 'creator_avatar', 'creator_handle');
    const now = Date.now();
    
    // Process and sort by viral algorithm
    const scoredStatuses = populated.map(reel => {
      const likes = reel.likes || 0;
      const views = reel.views || 0;
      const shares = reel.shares || 0;
      const followers = reel.follower_count || 0;
      
      const published = new Date(reel.published_at || reel.created_at || reel.createdAt || now).getTime();
      const ageHours = Math.max(0.1, (now - published) / (1000 * 60 * 60)); // Avoid division by zero
      
      // GVCA (Global Viral Connectivity Algorithm) Calculation
      const engagementScore = views + (likes * 3) + (shares * 5) + (followers * 0.05);
      const timeDecay = Math.pow(ageHours + 2, 1.8);
      const viralScore = engagementScore / timeDecay;
      
      return {
        ...reel,
        id: reel._id.toString(),
        _id: undefined,
        viralScore
      };
    });
    
    // Sort descending by viral score
    scoredStatuses.sort((a, b) => b.viralScore - a.viralScore);
    
    // Disable all caching - always fresh data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Return top 50 Global Latest Statuses
    return res.json({ 
      success: true, 
      algorithm: 'GVCA v1.0.0', 
      data: scoredStatuses.slice(0, 50) 
    });
  } catch (err) {
    console.error('Global Status API Error:', err);
    res.status(500).json({ error: 'Failed to evaluate global status queue' });
  }
});

app.post('/api/status', requireAuth, upload.single('media'), async (req, res) => {
  try {
    const creator = await Admin.findById(req.adminId);
    if (!creator) return res.status(404).json({ error: 'User not found' });
    
    let mediaUrl = '';
    let type = 'image';
    if (req.file) {
      if (req.file.mimetype && req.file.mimetype.startsWith('video')) type = 'video';

      if (useOfflineFallback || (hasR2Config && (req.file.location || req.file.key))) {
        if (useOfflineFallback) {
          const uploadsDir = path.resolve(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const ext = path.extname(req.file.originalname || '') || (type === 'video' ? '.mp4' : '.png');
          const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          fs.writeFileSync(path.join(uploadsDir, fileName), req.file.buffer);
          mediaUrl = `/uploads/${fileName}`;
        } else {
          mediaUrl = R2_PUBLIC_URL && req.file.key ? `${R2_PUBLIC_URL}/${req.file.key}` : req.file.location;
        }
      } else {
        return res.status(503).json({ error: 'Server storage migration: Appwrite storage disabled. Configure R2.' });
      }
    } else {
      return res.status(400).json({ error: 'Media file is required' });
    }

    const newStatus = await Status.create({
      creator_id: creator._id.toString(),
      creator_name: creator.name || 'ModeBook User',
      creator_avatar: creator.avatar_url || '',
      media_url: mediaUrl,
      type,
      caption: req.body.caption || ''
    });

    res.json({ data: newStatus.toJSON() });
  } catch (err) {
    console.error('Appwrite Status upload error:', err);
    res.status(500).json({ error: 'Failed to create status' });
  }
});

app.post('/api/status/:id/view', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    
    await Status.findByIdAndUpdate(req.params.id, { $addToSet: { viewers: userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update view' });
  }
});


if (!IS_VERCEL) {
  // IMPORTANT: keep OFF by default so deleted reels do not reappear from R2 on restart.
  const autoSyncR2OnStart = readEnv('AUTO_SYNC_R2_ON_START') === 'true';
  if (hasR2Config && autoSyncR2OnStart) {
    listAllR2Files().then(async files => {
      if (!files) return;
      const deletedUrlSet = await getDeletedReelUrlSet();
      for (const f of files) {
        if (f.key.match(/\.(mp4|webm|mov)$/i)) {
          if (deletedUrlSet.has(f.publicUrl)) continue;
          const ex = await Reel.findOne({ video_url: f.publicUrl });
          if (!ex) {
            await Reel.create({
              title: f.key.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              slug: f.key.replace(/[^a-zA-Z0-9]/g, '-') + '-' + Date.now(),
              video_url: f.publicUrl,
              status: 'published',
              is_active: true,
              creator_name: 'Admin'
            });
          }
        }
      }
      console.log('[R2 Sync] Startup sync completed because AUTO_SYNC_R2_ON_START=true');
    }).catch((err) => {
      console.error('[R2 Sync] Startup sync failed:', err);
    });
  } else if (hasR2Config) {
    console.log('[R2 Sync] Startup sync skipped (AUTO_SYNC_R2_ON_START is not true)');
  }


// ─── CONTENT REPORTS ───
app.post('/api/reports', async (req, res) => {
  try {
    const { reel_id, report_type, reason, details, reporter_device, reporter_url, timestamp, session_id } = req.body || {};
    if (!report_type || !reason) {
      return res.status(400).json({ error: 'report_type and reason are required.' });
    }
    const report = await Report.create({
      reel_id: reel_id || '',
      report_type,
      reason,
      details: details || '',
      reporter_device: reporter_device || '',
      reporter_url: reporter_url || '',
      session_id: session_id || '',
      status: 'pending',
    });
    return res.json({ success: true, id: report?.id || report?._id || '' });
  } catch (err) {
    console.error('Report create error:', err);
    return res.status(500).json({ error: 'Failed to create report.' });
  }
});

// ─── ANALYTICS: BATCH EVENTS ───
app.post('/api/analytics/events', async (req, res) => {
  try {
    const { events } = req.body || {};
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array is required.' });
    }
    let count = 0;
    for (const evt of events.slice(0, 50)) {
      try {
        await AnalyticsEvent.create({
          action: evt.action || 'unknown',
          target: evt.target || '',
          timestamp: evt.timestamp || new Date().toISOString(),
          session_id: evt.session_id || '',
        });
        count++;
      } catch (e) {
        console.error('Analytics event create error:', e.message);
      }
    }
    return res.json({ success: true, count });
  } catch (err) {
    console.error('Analytics events error:', err);
    return res.status(500).json({ error: 'Failed to store events.' });
  }
});

// ─── ANALYTICS: ERROR TRACKING ───
app.post('/api/analytics/errors', async (req, res) => {
  try {
    const { error_message, stack_trace, url, user_agent, timestamp, session_id } = req.body || {};
    if (!error_message) {
      return res.status(400).json({ error: 'error_message is required.' });
    }
    const errorDoc = await AnalyticsError.create({
      error_message: (error_message || '').slice(0, 1000),
      stack_trace: (stack_trace || '').slice(0, 5000),
      url: url || '',
      user_agent: (user_agent || '').slice(0, 500),
      session_id: session_id || '',
    });
    return res.json({ success: true, id: errorDoc?.id || errorDoc?._id || '' });
  } catch (err) {
    console.error('Analytics error tracking error:', err);
    return res.status(500).json({ error: 'Failed to store error.' });
  }
});

// ─── ANALYTICS: ADMIN DASHBOARD ───
app.get('/api/analytics/dashboard', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const [recentEvents, recentErrors, recentReports, recentDevReports] = await Promise.all([
      AnalyticsEvent.find().sort({ created_at: -1 }).limit(100).lean(),
      AnalyticsError.find().sort({ created_at: -1 }).limit(50).lean(),
      Report.find().sort({ created_at: -1 }).limit(50).lean(),
      DeveloperReport.find().sort({ created_at: -1 }).limit(20).lean(),
    ]);

    // Aggregate top features
    const featureCounts = {};
    for (const evt of recentEvents) {
      const key = evt.action || 'unknown';
      featureCounts[key] = (featureCounts[key] || 0) + 1;
    }
    const topFeatures = Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([action, count]) => ({ action, count }));

    return res.json({
      success: true,
      data: {
        features: topFeatures,
        errors: recentErrors.map(e => ({ id: e.id || e._id, error_message: e.error_message, url: e.url, created_at: e.created_at })),
        reports: recentReports.map(r => ({ id: r.id || r._id, report_type: r.report_type, reason: r.reason, reel_id: r.reel_id, status: r.status, created_at: r.created_at })),
        developer_reports: recentDevReports.map(d => ({ id: d.id || d._id, type: d.type, description: d.description, created_at: d.created_at })),
        stats: {
          totalEvents: recentEvents.length,
          totalErrors: recentErrors.length,
          totalReports: recentReports.length,
          totalDevReports: recentDevReports.length,
        },
      },
    });
  } catch (err) {
    console.error('Analytics dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// ─── DEVELOPER REPORTS ───
app.post('/api/developer-reports', async (req, res) => {
  try {
    const { type, description, device_info, browser_info, video_id, timestamp, logs, session_id } = req.body || {};
    if (!type || !description) {
      return res.status(400).json({ error: 'type and description are required.' });
    }
    const report = await DeveloperReport.create({
      type,
      description: (description || '').slice(0, 5000),
      device_info: typeof device_info === 'object' ? JSON.stringify(device_info) : (device_info || ''),
      browser_info: (browser_info || '').slice(0, 500),
      video_id: video_id || '',
      session_id: session_id || '',
      logs: typeof logs === 'object' ? JSON.stringify(logs) : (logs || ''),
      status: 'new',
    });
    return res.json({ success: true, id: report?.id || report?._id || '' });
  } catch (err) {
    console.error('Developer report create error:', err);
    return res.status(500).json({ error: 'Failed to create developer report.' });
  }
});

// ─── MUSIC LIBRARY ───
app.get('/api/music', async (req, res) => {
  try {
    const tracks = await MusicTrack.find({ is_active: true }).sort({ created_at: -1 });
    return res.json({ success: true, data: tracks });
  } catch (err) {
    console.error('Music fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch music.' });
  }
});

app.post('/api/music', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    const secret = req.headers['x-developer-secret'] || req.body.developer_secret;
    if (secret !== process.env.DEVELOPER_SECRET && secret !== 'DENCEWANCE_DEV_2026') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, artist } = req.body;
    if (!title || !req.files['audio']) {
      return res.status(400).json({ error: 'Title and audio file are required.' });
    }

    // Upload audio
    let audioUrl = '';
    const audioFile = req.files['audio'][0];
    
    if (useOfflineFallback) {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      
      const safeName = `audio-${Date.now()}-${audioFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fallbackPath = path.join(uploadsDir, safeName);
      fs.writeFileSync(fallbackPath, audioFile.buffer);
      audioUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/uploads/${safeName}`;
    } else {
      const audioInput = InputFile.fromBuffer(audioFile.buffer, audioFile.originalname || 'audio.mp3');
      const audioAppwrite = await appwriteStorage.createFile(APPWRITE_BUCKET_ID, ID.unique(), audioInput);
      audioUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, audioAppwrite.$id);
    }

    // Upload cover if exists
    let coverUrl = '';
    if (req.files['cover']) {
      const coverFile = req.files['cover'][0];
      if (useOfflineFallback) {
        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const safeName = `cover-${Date.now()}-${coverFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const fallbackPath = path.join(uploadsDir, safeName);
        fs.writeFileSync(fallbackPath, coverFile.buffer);
        coverUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/uploads/${safeName}`;
      } else {
        const coverInput = InputFile.fromBuffer(coverFile.buffer, coverFile.originalname || 'cover.jpg');
        const coverAppwrite = await appwriteStorage.createFile(APPWRITE_BUCKET_ID, ID.unique(), coverInput);
        coverUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, coverAppwrite.$id);
      }
    }

    const track = await MusicTrack.create({
      title,
      artist: artist || 'Unknown',
      audio_url: audioUrl,
      cover_image_url: coverUrl,
      duration: 0,
      is_active: true,
      created_at: new Date().toISOString()
    });

    return res.json({ success: true, data: track });
  } catch (err) {
    console.error('Music create error:', err);
    return res.status(500).json({ error: 'Failed to create music track.' });
  }
});

app.delete('/api/music/:id', async (req, res) => {
  try {
    const secret = req.headers['x-developer-secret'];
    if (secret !== process.env.DEVELOPER_SECRET && secret !== 'DENCEWANCE_DEV_2026') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await MusicTrack.delete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('Music delete error:', err);
    return res.status(500).json({ error: 'Failed to delete music track.' });
  }
});

  server.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
  });
}

