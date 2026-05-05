import 'dotenv/config';
import express from 'express';
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
import { initDb, Admin, News, Reel, SiteSettings, Status, UserProfile, ReelComment, SavedReel } from './db.js';
import { storage as appwriteStorage, databases as appwriteDatabases, ID, Query } from './appwrite.js';
import { InputFile } from 'node-appwrite/file';
import { requireAuth, signToken } from './middleware/auth.js';
import { slugify } from './utils/slug.js';
import { getReadingTime } from './utils/readingTime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const buildAppwriteFileViewUrl = (bucketId, fileId) => {
  if (!bucketId || !fileId) return '';
  return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
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
        cb(null, `alok/${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`);
      }
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
});

app.get('/', (req, res) => res.json({status: 'OK', message: 'Backend is running! Open Frontend on Port 3000'}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use((req,res,next)=>{console.log(req.method, req.url); next();});
app.use('/api/posts', (req, res, next) => {
  req.url = req.originalUrl.replace(/^\/api\/posts/, '/api/news');
  next();
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

// --- BULK DELETE ALL REELS (ADMIN ONLY) ---
app.delete('/api/reels/bulk-delete', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Only admins can bulk delete reels.' });
    }

    const allReels = await Reel.find().limit(1000).lean();
    let deleted = 0;
    for (const reel of allReels) {
      try {
        await Reel.findByIdAndDelete(reel._id);
        deleted++;
      } catch (e) {
        console.error('Failed to delete reel:', reel._id, e);
      }
    }

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

app.put('/api/profile', requireAuth, async (req, res) => {
  const { name, email, bio, avatar_url } = req.body || {};
  const updates = {};
  if (typeof name === 'string') updates.name = name;
  if (typeof email === 'string') updates.email = email;
  if (typeof bio === 'string') updates.bio = bio;
  if (typeof avatar_url === 'string') updates.avatar_url = avatar_url;
  const admin = await Admin.findByIdAndUpdate(
    req.adminId,
    updates,
    { new: true }
  );
  return res.json({ data: admin.toJSON() });
});

app.post('/api/profile/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const fileObj = InputFile.fromBuffer(req.file.buffer, req.file.originalname || `avatar-${Date.now()}.png`);
    const result = await appwriteStorage.createFile(APPWRITE_BUCKET_ID, ID.unique(), fileObj);
    const viewUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, result.$id);
    
    const admin = await Admin.findByIdAndUpdate(
      req.adminId,
      { avatar_url: viewUrl },
      { new: true }
    );
    return res.json({ data: admin.toJSON() });
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

    const usersResult = dedupe([userById, ...users]);
    const postsResult = dedupe([postById, ...posts]);
    const reelsResult = dedupe([reelById, ...reels]);

    return res.json({
      success: true,
      data: {
        users: usersResult,
        posts: postsResult,
        reels: reelsResult
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
    
    const normalize = arr => arr.map(a => ({ ...a, id: a._id.toString(), _id: undefined }));
    
    return res.json({
      success: true,
      data: {
        reels: normalize(trendingReels),
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

    return res.json({ data: news.map(n => ({ ...n, id: n._id.toString(), _id: undefined, __v: undefined })) });
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

    return res.json({ data: news.map(n => ({ ...n, id: n._id.toString(), _id: undefined, __v: undefined })) });
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

function resolveCreatorIdentity({ payload = {}, currentUser = null, fallbackSeed = '' } = {}) {
  const mode = payload.creator_mode || 'auto';

  if (mode === 'official' || !payload.creator_mode) {
    return {
      creator_mode: 'official',
      is_official_creator: true,
      creator_id: currentUser?._id?.toString() || '',
      is_demo_creator: false,
      creator_name: payload.custom_author_name || payload.creator_name || currentUser?.name || 'ALOK Official',
      creator_handle: payload.creator_handle || slugify((payload.custom_author_name || currentUser?.name || 'alokofficial').toLowerCase()),
      creator_avatar: payload.creator_avatar || currentUser?.avatar_url || '',
      follower_count: Number(payload.follower_count) > 0
        ? Number(payload.follower_count)
        : (Number(currentUser?.followers) > 0 ? Number(currentUser.followers) : 12500),
    };
  }
  
  if (mode === 'male') {
    return {
      creator_mode: 'auto',
      is_official_creator: false,
      is_demo_creator: false,
      creator_name: payload.custom_author_name || 'Dencewance Boy',
      creator_handle: slugify((payload.custom_author_name || 'denceboy').toLowerCase()),
      creator_avatar: 'https://i.pravatar.cc/150?img=11',
      follower_count: Math.floor(Math.random() * 5000) + 100,
    };
  }

  if (mode === 'female') {
    return {
      creator_mode: 'auto',
      is_official_creator: false,
      is_demo_creator: false,
      creator_name: payload.custom_author_name || 'Dencewance Girl',
      creator_handle: slugify((payload.custom_author_name || 'dencegirl').toLowerCase()),
      creator_avatar: 'https://i.pravatar.cc/150?img=5',
      follower_count: Math.floor(Math.random() * 15000) + 1000,
    };
  }

  const autoProfile = pickAutoCreatorProfile(fallbackSeed || payload.title || payload.video_url);
  return {
    creator_mode: 'auto',
    is_official_creator: false,
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
    const { limit = 100, active = 'true', creator_id } = req.query;
    const query = {};
    if (active === 'true') query.is_active = true;
    if (creator_id) query.creator_id = creator_id;

    const reels = await Reel.find(query)
      .sort({ published_at: -1 })
      .limit(Math.min(Number(limit) || 100, 500))
      .lean();

    return res.json({ data: reels.map((item) => ({ ...item, id: item._id.toString(), _id: undefined, __v: undefined })) });
  } catch (error) {
    console.error('Reels list error:', error);
    return res.status(500).json({ error: 'Failed to fetch reels.' });
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

    const scored = reels.map((item) => {
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
    if (!['superadmin', 'superadmin', 'admin', 'editor', 'author'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Permission denied to bulk create reels.' });
    }

    const links = Array.isArray(req.body?.links) ? req.body.links : [];
    const creatorMode = req.body?.creator_mode === 'official' ? 'official' : 'auto';
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

app.post('/api/reels/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!reel) return res.status(404).json({ error: 'Reel not found.' });
    return res.json({ data: reel.toJSON() });
  } catch (error) {
    console.error('Reel like error:', error);
    return res.status(500).json({ error: 'Failed to update reel likes.' });
  }
});

app.post('/api/reels', requireAuth, async (req, res) => {
  console.log('DEBUG: POST /api/reels called, adminId=', req.adminId);
  console.log('DEBUG: body preview=', JSON.stringify(req.body).slice(0, 1000));
  let currentUser = await Admin.findById(req.adminId);
  if (!currentUser) {
    console.log('DEBUG: No local Admin found for id=', req.adminId, ' — proceeding with fallback author identity');
    currentUser = { _id: req.adminId, role: 'author' };
  }
  if (!['superadmin', 'superadmin', 'admin', 'editor', 'author'].includes(currentUser.role)) {
    return res.status(403).json({ error: 'Permission denied to create reels.' });
  }

  const payload = { ...(req.body || {}) };
  if (!payload.video_url) {
    return res.status(400).json({ error: 'video_url required.' });
  }
  if (!payload.title || payload.title.trim() === '') {
    payload.title = `Video Story ${new Date().toLocaleDateString('en-IN')}`;
  }

  payload.video_url = normalizeReelVideoUrl(payload.video_url);
  const dedupKey = getVideoDedupKey(payload.video_url);

  const existingReel = await Reel.findOne({
    $or: [
      { dedup_key: dedupKey },
      { video_url: payload.video_url },
    ],
  });
  if (existingReel) {
    return res.status(200).json({
      duplicate: true,
      data: existingReel.toJSON(),
      message: 'This reel already exists.',
    });
  }

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
    creator_id: currentUser._id.toString(),
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
  return res.status(201).json({ data: responseData });
});

// Temporary test route: create a reel without auth (dev only)
app.post('/api/reels/test-create', async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    if (!payload.video_url) payload.video_url = payload.url || '';
    const dedupKey = getVideoDedupKey(payload.video_url || 'test-' + Date.now());
    const baseSlug = slugify(payload.title || `reel-${Date.now()}`) || `reel-${Date.now()}`;
    const slug = await findUniqueReelSlug(baseSlug);

    const reel = await Reel.create({
      title: payload.title || 'Test Reel',
      slug,
      caption: payload.caption || '',
      video_url: payload.video_url || '',
      dedup_key: dedupKey,
      cover_image_url: payload.cover_image_url || '',
      creator_id: payload.creator_id || '',
      creator_name: payload.creator_name || 'Test',
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

    const duplicate = await Reel.findOne({
      _id: { $ne: id },
      $or: [
        { dedup_key: payload.dedup_key },
        { video_url: payload.video_url },
      ],
    });
    if (duplicate) {
      return res.status(409).json({ error: 'Duplicate reel video link already exists.' });
    }
  }

  const reel = await Reel.findByIdAndUpdate(id, payload, { new: true });
  if (!reel) return res.status(404).json({ error: 'Reel not found.' });
  
  await clearCache('reels');
  return res.json({ data: reel.toJSON() });
});

app.delete('/api/reels/:id', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser) return res.status(404).json({ error: 'User not found.' });

    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ error: 'Reel not found.' });

    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && reel.creator_id !== currentUser._id.toString()) {
      return res.status(403).json({ error: 'Permission denied to delete this reel.' });
    }

    const deleted = await Reel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.error('Appwrite delete failed for reel:', req.params.id);
      return res.status(500).json({ error: 'Failed to delete reel from Appwrite DB.' });
    }
    await clearCache('reels');
    return res.json({ success: true, message: 'Reel deleted.' });
  } catch (error) {
    console.error('Reel delete error:', error);
    return res.status(500).json({ error: 'Failed to delete reel.', detail: error?.message || error });
  }
});

app.post('/api/news', requireAuth, async (req, res) => {
  const currentUser = await Admin.findById(req.adminId);
  if (!currentUser) return res.status(404).json({ error: 'User not found.' });
  if (!['superadmin', 'superadmin', 'admin', 'editor', 'author'].includes(currentUser.role)) {
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
    payload.source = currentUser.avatar_url || 'https://i.pravatar.cc/150?img=11'; // official icon/avatar
  } else if (payload.creator_mode === 'male') {
    payload.author_id = `male_${Date.now()}`;
    payload.author_name = payload.custom_author_name || 'Dencewance User';
    payload.source = 'https://i.pravatar.cc/150?img=11';
  } else if (payload.creator_mode === 'female') {
    payload.author_id = `female_${Date.now()}`;
    payload.author_name = payload.custom_author_name || 'Dencewance User';
    payload.source = 'https://i.pravatar.cc/150?img=5';
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
  if (!['superadmin', 'superadmin', 'admin', 'editor', 'author'].includes(currentUser.role)) {
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
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser) return res.status(404).json({ error: 'User not found.' });
    
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

    // Fallback to Appwrite storage for small files
    const fileObj = InputFile.fromBuffer(req.file.buffer, req.file.originalname || `cover-${Date.now()}.png`);
    const result = await appwriteStorage.createFile(APPWRITE_BUCKET_ID, ID.unique(), fileObj);
    const viewUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, result.$id);
    return res.json({ data: { url: viewUrl } });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload cover image' });
  }
});

app.post('/api/uploads/media', requireAuth, upload.single('media'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No media file uploaded.' });

  try {
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

    // Fallback to Appwrite storage (limited to smaller files due to payload limit)
    const MAX_APPWRITE_SIZE = 25 * 1024 * 1024; // 25MB max for Appwrite
    if (req.file.size > MAX_APPWRITE_SIZE) {
      return res.status(413).json({ 
        error: 'File too large for Appwrite storage. Please ensure R2 is configured or file is < 25MB' 
      });
    }

    const fileObj = InputFile.fromBuffer(req.file.buffer, req.file.originalname || `media-${Date.now()}.mp4`);
    const result = await appwriteStorage.createFile(APPWRITE_BUCKET_ID, ID.unique(), fileObj);
    const viewUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, result.$id);
    
    return res.json({
      data: {
        url: viewUrl,
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
app.post('/api/uploads/sign', requireAuth, async (req, res) => {
  if (!hasR2Config) {
    return res.status(503).json({ error: 'R2 not configured on this server.' });
  }
  
  try {
    const { filename, contentType } = req.body;
    
    // Fallbacks just in case
    const timestamp = Date.now();
    const ext = filename ? filename.split('.').pop() : 'mp4';
    const key = `alok/media/${timestamp}-${Math.round(Math.random() * 1e9)}.${ext}`;
    
    // We get back { uploadUrl, publicUrl }
    const signData = await generatePresignedUrl(key, contentType || 'video/mp4');
    
    return res.json({
      uploadUrl: signData.uploadUrl,
      publicUrl: signData.publicUrl,
      data: {
        timestamp: Math.round(timestamp / 1000),
        folder: 'alok/media',
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
    const result = await appwriteDatabases.listDocuments('69d60fe8000c9bd92750', 'pyq', [
      Query.orderDesc('$createdAt'),
      Query.limit(100)
    ]);
    res.json({ success: true, data: result.documents.map(normalizePYQDocument) });
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
          : [req.body.cover_url].filter(Boolean)
      };
      // Remove fields that Appwrite doesn't expect
      delete payload.fileType;
      const result = await appwriteDatabases.createDocument('69d60fe8000c9bd92750', 'pyq', ID.unique(), payload);
      res.json({ success: true, data: normalizePYQDocument(result) });
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
        await appwriteStorage.deleteFile(APPWRITE_BUCKET_ID, fileId);
      } catch(e) {
        console.warn("Could not delete from storage:", e.message);
      }
    }
    
    await appwriteDatabases.deleteDocument('69d60fe8000c9bd92750', 'pyq', id);
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

    const newComment = new ReelComment({
      reel_id: req.params.id,
      user_id: user_id || '60c72b2f9b1d8e4b88a91b2c', // Fallback objectId for test
      author_name: author_name || 'Anonymous',
      author_handle: author_handle || '@anonymous',
      author_avatar: author_avatar || '',
      text: text.trim()
    });
    
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Save/Bookmark for a Reel
app.post('/api/reels/:id/save', async (req, res) => {
  try {
    const { user_id } = req.body;
    const testUserId = user_id || '60c72b2f9b1d8e4b88a91b2c';
    
    const existing = await SavedReel.findOne({ reel_id: req.params.id, user_id: testUserId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ saved: false, message: 'Reel un-saved.' });
    } else {
      await SavedReel.create({ reel_id: req.params.id, user_id: testUserId });
      return res.json({ saved: true, message: 'Reel saved locally in profile.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like/Unlike a Reel
app.post('/api/reels/:id/like', async (req, res) => {
  try {
    const { user_id } = req.body;
    const userId = user_id || (req.adminId);
    const reelId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Must be logged in to like' });
    }

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    // Check if user already liked
    const likes = reel.likes_by || [];
    const alreadyLiked = likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      reel.likes_by = likes.filter(id => id !== userId);
      reel.likes = Math.max(0, (reel.likes || 0) - 1);
      await reel.save();
      return res.json({ liked: false, likes: reel.likes });
    } else {
      // Like
      reel.likes_by = [...likes, userId];
      reel.likes = (reel.likes || 0) + 1;
      await reel.save();
      return res.json({ liked: true, likes: reel.likes });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user liked a reel
app.get('/api/reels/:id/liked-by/:userId', async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }
    const isLiked = (reel.likes_by || []).includes(req.params.userId);
    return res.json({ liked: isLiked, likes: reel.likes || 0 });
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
    if (req.adminId !== comment.user_id && req.adminId !== comment.$id) {
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
      // Try to find from custom user_handle field
      const reels = await Reel.find({ creator_handle: handle }).limit(1);
      if (reels.length > 0) {
        return res.json({
          id: handle,
          name: reels[0].creator_name || 'User',
          handle: handle,
          avatar_url: reels[0].creator_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(handle),
          bio: `Creator: ${reels[0].creator_name}`,
          followers: 0,
          following: 0,
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
      followers: 0,
      following: 0,
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
app.get('/api/reels/sync-r2', async (req, res) => {
  try {
    if (!hasR2Config) {
      return res.status(400).json({ error: 'R2 is not configured' });
    }
    const files = await listAllR2Files();
    if (!files || files.length === 0) {
      return res.json({ message: 'No files found in R2' });
    }
    
    let added = 0;
    for (const file of files) {
      if (file.key.match(/\.(mp4|webm|mov)$/i)) {
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
            creator_name: 'Admin',
            creator_handle: 'admin',
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
    const now = Date.now();
    
    // Process and sort by viral algorithm
    const scoredStatuses = reels.map(reel => {
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
      
      const fileObj = InputFile.fromBuffer(req.file.buffer, req.file.originalname || `status-${Date.now()}.${type === 'video' ? 'mp4' : 'png'}`);
      const result = await appwriteStorage.createFile(APPWRITE_BUCKET_ID, ID.unique(), fileObj);
      mediaUrl = buildAppwriteFileViewUrl(APPWRITE_BUCKET_ID, result.$id);
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
      for (const f of files) {
        if (f.key.match(/\.(mp4|webm|mov)$/i)) {
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

  server.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
  });
}

