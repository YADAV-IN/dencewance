import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, default: 'author' },
  status: { type: String, default: 'active' },
  bio: { type: String, default: '' },
  avatar_url: { type: String, default: '' },
  last_login: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Add custom toJSON to convert _id to id
adminSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

export const Admin = mongoose.model('Admin', adminSchema);

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
  cover_image_url: { type: String, default: '' },
  gallery_urls: { type: String, default: '' },
  video_url: { type: String, default: '' },
  audio_url: { type: String, default: '' },
  source: { type: String, default: '' },
  ai_summary: { type: String, default: '' },
  author_name: { type: String, default: '' },
  author_email: { type: String, default: '' },
  author_twitter: { type: String, default: '' },
  author_instagram: { type: String, default: '' },
  meta_description: { type: String, default: '' },
  meta_keywords: { type: String, default: '' },
  seo_title: { type: String, default: '' },
  location: { type: String, default: '' },
  coordinates: { type: String, default: '' },
  twitter_url: { type: String, default: '' },
  facebook_url: { type: String, default: '' },
  instagram_url: { type: String, default: '' },
  youtube_url: { type: String, default: '' },
  published_at: { type: Date, default: Date.now },
  reading_time: { type: Number, default: 3 },
  is_featured: { type: Number, default: 0 },
  is_breaking: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  status: { type: String, default: 'published' },
  priority: { type: String, default: 'normal' },
  language: { type: String, default: 'hi' },
  expire_at: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

newsSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

export const News = mongoose.model('News', newsSchema);

const siteSettingsSchema = new mongoose.Schema({
  site_name: { type: String, default: 'ALOK' },
  site_subtitle: { type: String, default: 'बीजेएमसी न्यूज़' },
  site_title: { type: String, default: 'ALOK - बीजेएमसी न्यूज़' },
  site_description: { type: String, default: 'बीजेएमसी न्यूज़रूम - आपकी खबरों का भरोसेमंद स्रोत' },
  campaign: {
    enabled: { type: Boolean, default: false },
    mode: { type: String, default: 'banner' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    ctaText: { type: String, default: '' },
    ctaUrl: { type: String, default: '' },
    mediaType: { type: String, default: 'none' },
    mediaUrl: { type: String, default: '' },
    startAt: { type: String, default: '' },
    endAt: { type: String, default: '' },
    dismissHours: { type: Number, default: 24 },
    allowDismiss: { type: Boolean, default: true },
    openInNewTab: { type: Boolean, default: true },
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

siteSettingsSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

let isConnected = false;

export const initDb = async () => {
  if (isConnected) return;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully');

    // Create or reset primary admin from env vars
    const defaultEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'change-me-before-login';
    const defaultName = process.env.ADMIN_NAME || 'ALOK एडमिन';
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 || process.env.ADMIN_RESET === 'true') {
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      if (adminCount === 0) {
        await Admin.create({
          name: defaultName,
          email: defaultEmail,
          password_hash: passwordHash,
          role: 'admin',
          status: 'active',
          bio: 'डिजिटल न्यूज़रूम बिल्डर और BJMC स्टूडेंट प्रोफाइल।',
        });
        console.log('✅ Primary admin created:', defaultEmail);
      } else {
        await Admin.updateOne({ role: 'admin' }, { email: defaultEmail, password_hash: passwordHash, status: 'active' });
        console.log('✅ Primary admin credentials reset:', defaultEmail);
      }
    }

    // Create initial settings if none exists
    const settingsCount = await SiteSettings.countDocuments();
    if (settingsCount === 0) {
      await SiteSettings.create({
        site_name: 'ALOK',
        site_subtitle: 'बीजेएमसी न्यूज़',
        site_title: 'ALOK - बीजेएमसी न्यूज़',
        site_description: 'बीजेएमसी न्यूज़रूम - आपकी खबरों का भरोसेमंद स्रोत',
        campaign: {
          enabled: false,
          mode: 'banner',
          title: '',
          subtitle: '',
          description: '',
          ctaText: '',
          ctaUrl: '',
          mediaType: 'none',
          mediaUrl: '',
          startAt: '',
          endAt: '',
          dismissHours: 24,
          allowDismiss: true,
          openInNewTab: true,
        },
      });
      console.log('✅ Default site settings created');
    }

  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
};
