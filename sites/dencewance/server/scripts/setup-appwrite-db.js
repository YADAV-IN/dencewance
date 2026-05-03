import { Databases, Client } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5');

if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ ERROR: Please add APPWRITE_API_KEY to your server/.env file first!');
  process.exit(1);
}

client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DB_ID || '69d60fe8000c9bd92750';

async function ensureCollection(collectionId, name) {
  try {
    const collection = await databases.createCollection(DB_ID, collectionId, name);
    console.log(`✅ Collection created: ${name}`);
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Collection ${name} already exists. Ensuring attributes...`);
      return null;
    }
    throw error;
  }
}

async function ensureStringAttribute(collectionId, key, size, required, defaultValue, isArray = false) {
  try {
    const args = [DB_ID, collectionId, key, size, required];
    if (defaultValue !== undefined || isArray) {
      args.push(defaultValue);
      if (isArray) args.push(true);
    }
    await databases.createStringAttribute(...args);
    console.log(`✅ Attribute created: ${collectionId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${collectionId}.${key} already exists. Skipping...`);
      return;
    }
    throw error;
  }
}

async function ensureIntegerAttribute(collectionId, key, required = false, min = 0, max = 2147483647, defaultValue = 0) {
  try {
    await databases.createIntegerAttribute(DB_ID, collectionId, key, required, min, max, defaultValue);
    console.log(`✅ Attribute created: ${collectionId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${collectionId}.${key} already exists. Skipping...`);
      return;
    }
    throw error;
  }
}

async function ensureBooleanAttribute(collectionId, key, required = false, defaultValue = false) {
  try {
    await databases.createBooleanAttribute(DB_ID, collectionId, key, required, defaultValue);
    console.log(`✅ Attribute created: ${collectionId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${collectionId}.${key} already exists. Skipping...`);
      return;
    }
    throw error;
  }
}

async function ensureDatetimeAttribute(collectionId, key, required = false) {
  try {
    await databases.createDatetimeAttribute(DB_ID, collectionId, key, required);
    console.log(`✅ Attribute created: ${collectionId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${collectionId}.${key} already exists. Skipping...`);
      return;
    }
    throw error;
  }
}

async function ensureIndex(collectionId, key, type, attributes, orders = [], lengths = []) {
  try {
    await databases.createIndex(DB_ID, collectionId, key, type, attributes, orders, lengths);
    console.log(`✅ Index created: ${collectionId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Index ${collectionId}.${key} already exists. Skipping...`);
      return;
    }
    throw error;
  }
}

async function ensureTimestamps(collectionId) {
  await ensureDatetimeAttribute(collectionId, 'created_at', false);
  await ensureDatetimeAttribute(collectionId, 'updated_at', false);
}

async function createSchema() {
  try {
    console.log(`🚀 Starting Appwrite Database Setup for DB: ${DB_ID}...`);

    await ensureCollection('admins', 'Admins');
    await ensureStringAttribute('admins', 'name', 255, true);
    await ensureStringAttribute('admins', 'email', 255, true);
    await ensureStringAttribute('admins', 'password_hash', 1024, true);
    await ensureStringAttribute('admins', 'role', 50, false, 'author');
    await ensureStringAttribute('admins', 'status', 50, false, 'active');
    await ensureStringAttribute('admins', 'bio', 2048, false, '');
    await ensureStringAttribute('admins', 'avatar_url', 1024, false, '');
    await ensureIntegerAttribute('admins', 'followers', false, 0, 2147483647, 0);
    await ensureIntegerAttribute('admins', 'following', false, 0, 2147483647, 0);
    await ensureIntegerAttribute('admins', 'posts', false, 0, 2147483647, 0);
    await ensureDatetimeAttribute('admins', 'last_login', false);
    await ensureTimestamps('admins');
    await ensureIndex('admins', 'admins_email_unique', 'unique', ['email']);
    await ensureIndex('admins', 'admins_search', 'fulltext', ['name', 'email', 'bio']);
    await ensureIndex('admins', 'admins_role_created_at', 'key', ['role', 'created_at']);

    await ensureCollection('news', 'News');
    await ensureStringAttribute('news', 'title', 500, true);
    await ensureStringAttribute('news', 'slug', 255, true);
    await ensureStringAttribute('news', 'excerpt', 2048, true);
    await ensureStringAttribute('news', 'content', 100000, true);
    await ensureStringAttribute('news', 'category', 255, true);
    await ensureStringAttribute('news', 'tags', 100, false, undefined, true);
    await ensureStringAttribute('news', 'cover_image_url', 1024, false, '');
    await ensureStringAttribute('news', 'status', 50, false, 'published');
    await ensureIntegerAttribute('news', 'views', false, 0, 2147483647, 0);
    await ensureStringAttribute('news', 'author_id', 255, false, '');
    await ensureStringAttribute('news', 'author_name', 255, false, '');
    await ensureStringAttribute('news', 'author_email', 255, false, '');
    await ensureStringAttribute('news', 'source', 1024, false, '');
    await ensureStringAttribute('news', 'language', 50, false, 'hi');
    await ensureStringAttribute('news', 'priority', 50, false, 'normal');
    await ensureIntegerAttribute('news', 'reading_time', false, 0, 100000, 0);
    await ensureIntegerAttribute('news', 'is_featured', false, 0, 1, 0);
    await ensureIntegerAttribute('news', 'is_breaking', false, 0, 1, 0);
    await ensureDatetimeAttribute('news', 'published_at', false);
    await ensureTimestamps('news');
    await ensureIndex('news', 'news_slug_unique', 'unique', ['slug']);
    await ensureIndex('news', 'news_search', 'fulltext', ['title', 'excerpt', 'content', 'category', 'author_name', 'author_email', 'source']);
    await ensureIndex('news', 'news_published_at', 'key', ['published_at']);
    await ensureIndex('news', 'news_author_published_at', 'key', ['author_id', 'published_at']);
    await ensureIndex('news', 'news_category_published_at', 'key', ['category', 'published_at']);
    await ensureIndex('news', 'news_status_published_at', 'key', ['status', 'published_at']);
    await ensureIndex('news', 'news_featured_published_at', 'key', ['is_featured', 'published_at']);
    await ensureIndex('news', 'news_breaking_published_at', 'key', ['is_breaking', 'published_at']);

    await ensureCollection('reels', 'Reels');
    await ensureStringAttribute('reels', 'title', 500, true);
    await ensureStringAttribute('reels', 'slug', 255, true);
    await ensureStringAttribute('reels', 'video_url', 1024, true);
    await ensureStringAttribute('reels', 'caption', 2048, false, '');
    await ensureStringAttribute('reels', 'dedup_key', 1024, false, '');
    await ensureStringAttribute('reels', 'cover_image_url', 1024, false, '');
    await ensureStringAttribute('reels', 'creator_id', 255, false, '');
    await ensureStringAttribute('reels', 'creator_name', 255, false, '');
    await ensureStringAttribute('reels', 'creator_handle', 255, false, '');
    await ensureStringAttribute('reels', 'creator_avatar', 1024, false, '');
    await ensureStringAttribute('reels', 'creator_mode', 50, false, 'auto');
    await ensureIntegerAttribute('reels', 'follower_count', false, 0, 2147483647, 0);
    await ensureBooleanAttribute('reels', 'is_official_creator', false, false);
    await ensureBooleanAttribute('reels', 'is_demo_creator', false, false);
    await ensureStringAttribute('reels', 'tags', 100, false, undefined, true);
    await ensureStringAttribute('reels', 'status', 50, false, 'published');
    await ensureBooleanAttribute('reels', 'is_active', false, true);
    await ensureDatetimeAttribute('reels', 'published_at', false);
    await ensureIntegerAttribute('reels', 'views', false, 0, 2147483647, 0);
    await ensureIntegerAttribute('reels', 'likes', false, 0, 2147483647, 0);
    await ensureIntegerAttribute('reels', 'shares', false, 0, 2147483647, 0);
    await ensureTimestamps('reels');
    await ensureIndex('reels', 'reels_slug_unique', 'unique', ['slug']);
    await ensureIndex('reels', 'reels_search', 'fulltext', ['title', 'caption', 'creator_name', 'creator_handle', 'dedup_key']);
    await ensureIndex('reels', 'reels_published_at', 'key', ['published_at']);
    await ensureIndex('reels', 'reels_is_active_published_at', 'key', ['is_active', 'published_at']);
    await ensureIndex('reels', 'reels_is_active_creator_published_at', 'key', ['is_active', 'creator_id', 'published_at']);
    await ensureIndex('reels', 'reels_creator_published_at', 'key', ['creator_id', 'published_at']);
    await ensureIndex('reels', 'reels_status_published_views', 'key', ['status', 'published_at', 'views']);
    await ensureIndex('reels', 'reels_status_likes', 'key', ['status', 'likes']);

    await ensureCollection('status', 'Status');
    await ensureStringAttribute('status', 'creator_id', 255, false, '');
    await ensureStringAttribute('status', 'creator_name', 255, false, '');
    await ensureStringAttribute('status', 'creator_avatar', 1024, false, '');
    await ensureStringAttribute('status', 'media_url', 1024, true);
    await ensureStringAttribute('status', 'type', 50, false, 'image');
    await ensureStringAttribute('status', 'caption', 2048, false, '');
    await ensureStringAttribute('status', 'viewers', 255, false, undefined, true);
    await ensureBooleanAttribute('status', 'is_active', false, true);
    await ensureDatetimeAttribute('status', 'expires_at', false);
    await ensureTimestamps('status');
    await ensureIndex('status', 'status_creator_created_at', 'key', ['creator_id', 'created_at']);
    await ensureIndex('status', 'status_created_at', 'key', ['created_at']);

    await ensureCollection('settings', 'Settings');
    await ensureStringAttribute('settings', 'site_name', 255, false, 'ModeBook');
    await ensureStringAttribute('settings', 'site_subtitle', 255, false, '');
    await ensureStringAttribute('settings', 'site_description', 2048, false, '');
    await ensureStringAttribute('settings', 'site_logo_url', 1024, false, '');
    await ensureStringAttribute('settings', 'site_favicon_url', 1024, false, '');
    await ensureIntegerAttribute('settings', 'total_views', false, 0, 2147483647, 0);
    await ensureBooleanAttribute('settings', 'campaign_enabled', false, false);
    await ensureStringAttribute('settings', 'campaign_mode', 50, false, 'banner');
    await ensureStringAttribute('settings', 'campaign_title', 255, false, '');
    await ensureStringAttribute('settings', 'campaign_subtitle', 255, false, '');
    await ensureStringAttribute('settings', 'campaign_description', 2048, false, '');
    await ensureStringAttribute('settings', 'campaign_ctaText', 255, false, '');
    await ensureStringAttribute('settings', 'campaign_ctaUrl', 1024, false, '');
    await ensureStringAttribute('settings', 'campaign_mediaType', 50, false, 'none');
    await ensureStringAttribute('settings', 'campaign_mediaUrl', 1024, false, '');
    await ensureStringAttribute('settings', 'campaign_startAt', 255, false, '');
    await ensureStringAttribute('settings', 'campaign_endAt', 255, false, '');
    await ensureIntegerAttribute('settings', 'campaign_dismissHours', false, 0, 168, 24);
    await ensureBooleanAttribute('settings', 'campaign_allowDismiss', false, true);
    await ensureBooleanAttribute('settings', 'campaign_openInNewTab', false, true);
    await ensureTimestamps('settings');
    await ensureIndex('settings', 'settings_created_at', 'key', ['created_at']);

    await ensureCollection('comments', 'Comments');
    await ensureStringAttribute('comments', 'reel_id', 255, true);
    await ensureStringAttribute('comments', 'user_id', 255, true);
    await ensureStringAttribute('comments', 'author_name', 255, false, 'Anonymous');
    await ensureStringAttribute('comments', 'author_handle', 255, false, '@anonymous');
    await ensureStringAttribute('comments', 'author_avatar', 1024, false, '');
    await ensureStringAttribute('comments', 'text', 5000, true);
    await ensureIntegerAttribute('comments', 'likes', false, 0, 2147483647, 0);
    await ensureBooleanAttribute('comments', 'is_edited', false, false);
    await ensureTimestamps('comments');
    await ensureIndex('comments', 'comments_reel_created_at', 'key', ['reel_id', 'created_at']);

    await ensureCollection('saved_reels', 'Saved Reels');
    await ensureStringAttribute('saved_reels', 'user_id', 255, true);
    await ensureStringAttribute('saved_reels', 'reel_id', 255, true);
    await ensureTimestamps('saved_reels');
    await ensureIndex('saved_reels', 'saved_reels_user_reel_unique', 'unique', ['user_id', 'reel_id']);
    await ensureIndex('saved_reels', 'saved_reels_user_created_at', 'key', ['user_id', 'created_at']);

    await ensureCollection('profiles', 'Profiles');
    await ensureStringAttribute('profiles', 'name', 255, true);
    await ensureStringAttribute('profiles', 'email', 255, true);
    await ensureStringAttribute('profiles', 'handle', 255, false, '');
    await ensureStringAttribute('profiles', 'bio', 2048, false, '');
    await ensureStringAttribute('profiles', 'avatar_url', 1024, false, '');
    await ensureStringAttribute('profiles', 'cover_url', 1024, false, '');
    await ensureStringAttribute('profiles', 'website', 1024, false, '');
    await ensureIntegerAttribute('profiles', 'followers', false, 0, 2147483647, 0);
    await ensureIntegerAttribute('profiles', 'following', false, 0, 2147483647, 0);
    await ensureIntegerAttribute('profiles', 'posts', false, 0, 2147483647, 0);
    await ensureBooleanAttribute('profiles', 'verified', false, false);
    await ensureTimestamps('profiles');
    await ensureIndex('profiles', 'profiles_email_unique', 'unique', ['email']);
    await ensureIndex('profiles', 'profiles_handle_unique', 'unique', ['handle']);
    await ensureIndex('profiles', 'profiles_search', 'fulltext', ['name', 'handle', 'email', 'bio']);
    await ensureIndex('profiles', 'profiles_created_at', 'key', ['created_at']);

    console.log('\n🎉 Appwrite schema sync complete for all live collections.');
    console.log('Please keep the collection IDs aligned with the runtime wrapper.');
  } catch (error) {
    console.error('❌ Error during setup:', error);
  }
}

createSchema().catch((error) => {
  console.error('❌ Unhandled schema setup failure:', error);
  process.exit(1);
});
