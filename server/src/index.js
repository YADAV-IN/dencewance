import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { initDb, Admin, News, SiteSettings } from './db.js';
import { requireAuth, signToken } from './middleware/auth.js';
import { slugify, ensureUniqueSlug } from './utils/slug.js';
import { getReadingTime } from './utils/readingTime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const IS_VERCEL = process.env.VERCEL === '1';

// We parse the Cloudinary config straight from the URL if CLOUDINARY_URL is present
// Otherwise it tries to extract it from individual variables if defined
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'covers';
    if (file.fieldname === 'avatar') folder = 'avatars';
    else if (file.fieldname === 'media') folder = 'media';

    return {
      folder: `alok/${folder}`,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'webm', 'mp3'],
      resource_type: 'auto', // for videos/audio
    };
  },
});

const upload = multer({ storage });

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

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

app.use(async (req, res, next) => {
  try {
    await ensureDbInit();
    next();
  } catch (err) {
    console.error('DB init middleware error:', err);
    return res.status(500).json({ error: 'Database initialization failed' });
  }
});

app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), vercel: IS_VERCEL });
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
    if (!['admin'].includes(admin.role) && admin.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Only primary admin can log in.' });
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
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
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
    console.error('Create admin error:', error);
    return res.status(500).json({ error: 'Server error while creating admin.' });
  }
});

app.get('/api/admins', requireAuth, async (req, res) => {
  try {
    const admins = await Admin.find().sort({ role: 1, created_at: -1 });
    return res.json({ data: admins.map(a => a.toJSON()) });
  } catch (error) {
    console.error('List admins error:', error);
    return res.status(500).json({ error: 'Server error while fetching admins.' });
  }
});

app.put('/api/admins/:id', requireAuth, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Update admin error:', error);
    return res.status(500).json({ error: 'Server error while updating admin.' });
  }
});

app.put('/api/admins/:id/password', requireAuth, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ error: 'Server error while updating password.' });
  }
});

app.delete('/api/admins/:id', requireAuth, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Delete admin error:', error);
    return res.status(500).json({ error: 'Server error while deleting admin.' });
  }
});

app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(404).json({ error: 'Profile not found.' });
    return res.json({ data: admin.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Server error while fetching profile.' });
  }
});

app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const { name, email, bio, avatar_url } = req.body || {};
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined) {
      if (typeof avatar_url !== 'string' ||
          (!avatar_url.startsWith('http://') &&
           !avatar_url.startsWith('https://') &&
           !avatar_url.startsWith('data:image/'))) {
        return res.status(400).json({ error: 'Invalid avatar_url format.' });
      }
      updateData.avatar_url = avatar_url;
    }
    const admin = await Admin.findByIdAndUpdate(
      req.adminId,
      updateData,
      { new: true }
    );
    return res.json({ data: admin.toJSON() });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Server error while updating profile.' });
  }
});

app.post('/api/profile/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const admin = await Admin.findByIdAndUpdate(
      req.adminId,
      { avatar_url: req.file.path },
      { new: true }
    );
    return res.json({ data: admin.toJSON() });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ error: 'Server error while uploading avatar.' });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const { limit = 12, category, q } = req.query;
    const query = {};
    if (category) query.category = category;
    if (q) {
      query.$or = [
        { title: new RegExp(q, 'i') },
        { content: new RegExp(q, 'i') }
      ];
    }

    const news = await News.find(query)
      .sort({ published_at: -1 })
      .limit(Number(limit));

    return res.json({ data: news.map(n => n.toJSON()) });
  } catch (error) {
    console.error('List news error:', error);
    return res.status(500).json({ error: 'Server error while fetching news.' });
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
    console.error('Get news error:', error);
    return res.status(500).json({ error: 'Server error while fetching news.' });
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

app.post('/api/news', requireAuth, async (req, res) => {
  const payload = req.body || {};
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
  const { id } = req.params;
  const payload = req.body || {};
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
    await News.findByIdAndDelete(id);
    return res.status(204).send();
  } catch (error) {
    console.error('Delete news error:', error);
    return res.status(500).json({ error: 'Server error while deleting news.' });
  }
});

app.post('/api/uploads/cover', requireAuth, upload.single('cover'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    return res.json({ data: { url: req.file.path } });
  } catch (error) {
    console.error('Upload cover error:', error);
    return res.status(500).json({ error: 'Server error while uploading cover.' });
  }
});

app.post('/api/uploads/media', requireAuth, upload.single('media'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No media file uploaded.' });
  try {
    return res.json({ data: { url: req.file.path } });
  } catch (error) {
    console.error('Upload media error:', error);
    return res.status(500).json({ error: 'Server error while uploading media.' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await SiteSettings.findOne().sort({ created_at: -1 });
    return res.json({ data: settings ? settings.toJSON() : null });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: 'Server error while fetching settings.' });
  }
});

app.put('/api/settings', requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    let settings = await SiteSettings.findOne().sort({ created_at: -1 });

    if (!settings) {
      settings = await SiteSettings.create(payload);
    } else {
      Object.assign(settings, payload);
      await settings.save();
    }
    return res.json({ data: settings.toJSON() });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Server error while updating settings.' });
  }
});

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
  });
}

export default app;
