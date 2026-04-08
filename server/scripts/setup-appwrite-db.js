import { 
  Databases, 
  Client, 
  ID 
} from 'node-appwrite';
import 'dotenv/config';

// Script to automatically create all Collections and Attributes in Appwrite for the ModeBook project
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5');
  
if (!process.env.APPWRITE_API_KEY) {
  console.error("❌ ERROR: Please add APPWRITE_API_KEY to your server/.env file first!");
  process.exit(1);
}
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DB_ID || '69d60fe8000c9bd92750';

async function createSchema() {
  try {
    console.log(`🚀 Starting Appwrite Database Setup for DB: ${DB_ID}...`);

    // 1. Create Admins Collection
    const adminCol = await createCollection('admins', 'Admins');
    if (adminCol) {
      await databases.createStringAttribute(DB_ID, adminCol.$id, 'name', 255, true);
      await databases.createStringAttribute(DB_ID, adminCol.$id, 'email', 255, true);
      await databases.createStringAttribute(DB_ID, adminCol.$id, 'password_hash', 1024, true);
      await databases.createStringAttribute(DB_ID, adminCol.$id, 'role', 50, false, 'author');
      await databases.createStringAttribute(DB_ID, adminCol.$id, 'status', 50, false, 'active');
      await databases.createStringAttribute(DB_ID, adminCol.$id, 'bio', 2048, false, '');
      await databases.createStringAttribute(DB_ID, adminCol.$id, 'avatar_url', 1024, false, '');
      await databases.createDatetimeAttribute(DB_ID, adminCol.$id, 'last_login', false);
      console.log('✅ Admins Schema Created.');
    }

    // 2. Create News Collection
    const newsCol = await createCollection('news', 'News');
    if (newsCol) {
      await databases.createStringAttribute(DB_ID, newsCol.$id, 'title', 500, true);
      await databases.createStringAttribute(DB_ID, newsCol.$id, 'slug', 255, true);
      await databases.createStringAttribute(DB_ID, newsCol.$id, 'excerpt', 2048, true);
      await databases.createStringAttribute(DB_ID, newsCol.$id, 'content', 100000, true); // large text
      await databases.createStringAttribute(DB_ID, newsCol.$id, 'category', 255, true);
      await databases.createStringAttribute(DB_ID, newsCol.$id, 'tags', 100, false, undefined, true); // ARRAY of Strings
      await databases.createStringAttribute(DB_ID, newsCol.$id, 'cover_image_url', 1024, false, '');
      await databases.createStringAttribute(DB_ID, newsCol.$id, 'status', 50, false, 'published');
      await databases.createIntegerAttribute(DB_ID, newsCol.$id, 'views', false, 0, 1000000000, 0);
      await databases.createDatetimeAttribute(DB_ID, newsCol.$id, 'published_at', false);
      console.log('✅ News Schema Created.');
    }

    // 3. Create Reels Collection
    const reelCol = await createCollection('reels', 'Reels');
    if (reelCol) {
      await databases.createStringAttribute(DB_ID, reelCol.$id, 'title', 500, true);
      await databases.createStringAttribute(DB_ID, reelCol.$id, 'slug', 255, true);
      await databases.createStringAttribute(DB_ID, reelCol.$id, 'video_url', 1024, true);
      await databases.createStringAttribute(DB_ID, reelCol.$id, 'caption', 2048, false, '');
      await databases.createStringAttribute(DB_ID, reelCol.$id, 'creator_id', 255, false, '');
      await databases.createStringAttribute(DB_ID, reelCol.$id, 'status', 50, false, 'published');
      await databases.createDatetimeAttribute(DB_ID, reelCol.$id, 'published_at', false);
      console.log('✅ Reels Schema Created.');
    }

    console.log(`\n🎉 All required tables created in ModeBook Database!`);
    console.log(`Please save these Collection IDs in your .env or source code.`);
  } catch (error) {
    console.error('❌ Error during setup:', error);
  }
}

async function createCollection(id, name) {
  try {
    const col = await databases.createCollection(DB_ID, id, name);
    return col;
  } catch (err) {
    if (err.code === 409) {
      console.log(`⚠️ Collection ${name} already exists. Skipping...`);
      return null; // Return null so we don't try to recreate attributes
    } else {
      throw err;
    }
  }
}

createSchema();