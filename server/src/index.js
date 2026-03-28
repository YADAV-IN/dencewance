import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
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

const cloudinaryCloudName = readEnv('CLOUDINARY_CLOUD_NAME');
const cloudinaryApiKey = readEnv('CLOUDINARY_API_KEY');
const cloudinaryApiSecret = readEnv('CLOUDINARY_API_SECRET');
const cloudinaryUrl = readEnv('CLOUDINARY_URL');

const explicitCloudinaryConfig =
  !!cloudinaryCloudName &&
  !!cloudinaryApiKey &&
  !!cloudinaryApiSecret;

const getCloudinaryConfig = () => {
  if (explicitCloudinaryConfig) {
    return {
      cloud_name: cloudinaryCloudName,
      api_key: cloudinaryApiKey,
      api_secret: cloudinaryApiSecret,
    };
  }

  if (cloudinaryUrl) {
    try {
      const url = new URL(cloudinaryUrl);
      if (url.username && url.password && url.host) {
        return {
          cloud_name: url.host,
          api_key: url.username,
          api_secret: url.password,
        };
      }
    } catch (e) {
      console.error('Failed to parse CLOUDINARY_URL:', e.message);
    }
  }

  return null;
};

const cloudinaryConfig = getCloudinaryConfig();
const hasCloudinaryConfig = !!cloudinaryConfig;

if (cloudinaryConfig) {
  cloudinary.config(cloudinaryConfig);
}

const storage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        let folder = 'covers';
        let resource_type = 'image';
        if (file.fieldname === 'avatar') {
          folder = 'avatars';
          resource_type = 'image';
        } else if (file.fieldname === 'media') {
          folder = 'media';
          resource_type = 'auto'; // handles video, audio, image
        }

        return {
          folder: `alok/${folder}`,
          resource_type,
          allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'webm', 'mov', 'avi', 'mp3'],
        };
      },
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '500mb' }));

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
    mongodb: !!process.env.MONGODB_URI,
    jwt: !!process.env.JWT_SECRET,
    cloudinary: hasCloudinaryConfig,
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
    if (currentUser.role !== 'admin') {
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

  if (currentUser.role !== 'admin' && req.adminId !== id) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const { name, email, role, status, bio } = req.body || {};

  if (currentUser.role !== 'admin' && (role || status)) {
    return res.status(403).json({ error: 'Cannot change role or status.' });
  }

  if (name) targetUser.name = name;
  if (email) targetUser.email = email;
  if (role) targetUser.role = role;
  if (status) targetUser.status = status;
  if (bio !== undefined) targetUser.bio = bio;

  await targetUser.save();
  return res.json({ data: targetUser.toJSON() });
});

app.put('/api/admins/:id/password', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password required.' });

  const currentUser = await Admin.findById(req.adminId);

  if (currentUser.role !== 'admin' && req.adminId !== id) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const targetUser = await Admin.findById(id);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  targetUser.password_hash = await bcrypt.hash(password, 10);
  await targetUser.save();

  return res.json({ data: { id, message: 'Password updated successfully' } });
});

app.delete('/api/admins/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const currentUser = await Admin.findById(req.adminId);

  if (currentUser.role !== 'admin') {
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
  const avatarUrl = hasCloudinaryConfig
    ? req.file.path
    : `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;
  const admin = await Admin.findByIdAndUpdate(
    req.adminId,
    { avatar_url: avatarUrl },
    { new: true }
  );
  return res.json({ data: admin.toJSON() });
});

app.get('/api/news', async (req, res) => {
  try {
    const { limit = 12, category, q, status, featured, breaking } = req.query;
    const query = {};
    if (category) query.category = category;
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

async function findUniqueSlugMongoose(baseSlug) {
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

app.get('/api/reels', async (req, res) => {
  try {
    const { limit = 50, active = 'true' } = req.query;
    const query = {};
    if (active === 'true') query.is_active = true;

    const reels = await Reel.find(query)
      .sort({ published_at: -1 })
      .limit(Math.min(Number(limit) || 50, 200))
      .lean();

    return res.json({ data: reels.map((item) => ({ ...item, id: item._id.toString(), _id: undefined, __v: undefined })) });
  } catch (error) {
    console.error('Reels list error:', error);
    return res.status(500).json({ error: 'Failed to fetch reels.' });
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

app.post('/api/reels', requireAuth, async (req, res) => {
  const currentUser = await Admin.findById(req.adminId);
  if (!currentUser) return res.status(404).json({ error: 'User not found.' });
  if (!['admin', 'editor', 'author'].includes(currentUser.role)) {
    return res.status(403).json({ error: 'Permission denied to create reels.' });
  }

  const payload = { ...(req.body || {}) };
  if (!payload.title || !payload.video_url) {
    return res.status(400).json({ error: 'Title and video_url required.' });
  }

  const baseSlug = slugify(payload.title) || `reel-${Date.now()}`;
  const slug = await findUniqueReelSlug(baseSlug);

  const reel = await Reel.create({
    title: payload.title,
    slug,
    caption: payload.caption || '',
    video_url: payload.video_url,
    cover_image_url: payload.cover_image_url || '',
    creator_name: payload.creator_name || currentUser.name || 'ALOK Creator',
    creator_handle: payload.creator_handle || slugify((currentUser.name || 'alok').toLowerCase()),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    status: payload.status || 'published',
    is_active: payload.is_active !== false,
    published_at: payload.published_at || new Date(),
  });

  return res.status(201).json({ data: reel.toJSON() });
});

app.put('/api/reels/:id', requireAuth, async (req, res) => {
  const currentUser = await Admin.findById(req.adminId);
  if (!currentUser) return res.status(404).json({ error: 'User not found.' });
  if (!['admin', 'editor'].includes(currentUser.role)) {
    return res.status(403).json({ error: 'Permission denied to update reels.' });
  }

  const { id } = req.params;
  const payload = { ...(req.body || {}) };
  const reel = await Reel.findByIdAndUpdate(id, payload, { new: true });
  if (!reel) return res.status(404).json({ error: 'Reel not found.' });
  return res.json({ data: reel.toJSON() });
});

app.delete('/api/reels/:id', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || !['admin', 'editor'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Permission denied to delete reels.' });
    }

    const result = await Reel.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Reel not found.' });
    return res.status(204).send();
  } catch (error) {
    console.error('Reel delete error:', error);
    return res.status(500).json({ error: 'Failed to delete reel.' });
  }
});

app.post('/api/news', requireAuth, async (req, res) => {
  const currentUser = await Admin.findById(req.adminId);
  if (!currentUser) return res.status(404).json({ error: 'User not found.' });
  if (!['admin', 'editor', 'author'].includes(currentUser.role)) {
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

  const baseSlug = slugify(payload.title);
  const slug = await findUniqueSlugMongoose(baseSlug);

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
    return res.status(201).json({ data: news.toJSON() });
  } catch (error) {
    console.error("Error inserting news:", error);
    return res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

app.put('/api/news/:id', requireAuth, async (req, res) => {
  const currentUser = await Admin.findById(req.adminId);
  if (!currentUser) return res.status(404).json({ error: 'User not found.' });
  if (!['admin', 'editor', 'author'].includes(currentUser.role)) {
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
    return res.json({ data: existing.toJSON() });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: 'Update Failed: ' + error.message });
  }
});

app.delete('/api/news/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await News.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: 'News not found.' });
    return res.status(204).send();
  } catch (error) {
    console.error('News delete error:', error);
    return res.status(500).json({ error: 'Failed to delete news.' });
  }
});

app.post('/api/uploads/cover', requireAuth, upload.single('cover'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  if (hasCloudinaryConfig) {
    return res.json({ data: { url: req.file.path } });
  }

  if (!req.file.mimetype?.startsWith('image/')) {
    return res.status(400).json({ error: 'Cover upload supports images only.' });
  }

  const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  return res.json({ data: { url: dataUrl } });
});

app.post('/api/uploads/media', requireAuth, upload.single('media'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No media file uploaded.' });

  if (hasCloudinaryConfig) {
    // Cloudinary returns the full URL in req.file.path
    const fileInfo = {
      url: req.file.path,
      public_id: req.file.filename || '',
      resource_type: req.file.resource_type || 'auto',
      format: req.file.format || '',
      size: req.file.size || 0,
      original_name: req.file.originalname || '',
    };
    return res.json({ data: fileInfo });
  }

  // No Cloudinary: only allow small files as base64 fallback
  if (req.file.size > 4 * 1024 * 1024) {
    return res.status(413).json({
      error: 'Cloudinary not configured. Without Cloudinary, max file size is 4MB. Large video uploads require Cloudinary.',
    });
  }

  const dataUrl = `data:${req.file.mimetype || 'application/octet-stream'};base64,${req.file.buffer.toString('base64')}`;
  return res.json({ data: { url: dataUrl, original_name: req.file.originalname, size: req.file.size } });
});

// ── Sign a direct Cloudinary upload (browser → Cloudinary, bypasses Vercel payload limit) ──
app.post('/api/uploads/sign', requireAuth, async (req, res) => {
  if (!hasCloudinaryConfig) {
    return res.status(503).json({ error: 'Cloudinary not configured on this server.' });
  }
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'alok/media';
  const paramsToSign = { folder, timestamp };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinaryConfig.api_secret);
  return res.json({
    data: {
      timestamp,
      signature,
      folder,
      resource_type: 'video',
      api_key: cloudinaryConfig.api_key,
      cloud_name: cloudinaryConfig.cloud_name,
    },
  });
});

// ── Cleanup: delete all reels with base64/blob video_urls (junk data before Cloudinary) ──
app.delete('/api/reels/cleanup-junk', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || currentUser.role !== 'admin') {
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
    const settings = await SiteSettings.findOne().sort({ created_at: -1 }).lean();
    if (!settings) return res.json({ data: null });
    return res.json({ data: { ...settings, id: settings._id.toString(), _id: undefined, __v: undefined } });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

app.put('/api/settings', requireAuth, async (req, res) => {
  const payload = req.body || {};
  let settings = await SiteSettings.findOne().sort({ created_at: -1 });

  if (!settings) {
    settings = await SiteSettings.create(payload);
  } else {
    Object.assign(settings, payload);
    await settings.save();
  }
  return res.json({ data: settings.toJSON() });
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

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
  });
}

export default app;
