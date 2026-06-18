import { Databases, Client, ID } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5');

if (!process.env.APPWRITE_API_KEY) {
  console.error('❌ ERROR: Please add APPWRITE_API_KEY to your server/.env file!');
  process.exit(1);
}

client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DB_ID || '69d60fe8000c9bd92750';
const COLL_ID = 'age_preferences';

async function ensureCollection() {
  try {
    await databases.createCollection(DB_ID, COLL_ID, 'Age Preferences');
    console.log(`✅ Collection created: Age Preferences`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Collection Age Preferences already exists.`);
    } else {
      throw error;
    }
  }
}

async function ensureStringAttribute(key, size, required, defaultValue) {
  try {
    await databases.createStringAttribute(DB_ID, COLL_ID, key, size, required, defaultValue);
    console.log(`✅ Attribute created: ${COLL_ID}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${COLL_ID}.${key} already exists. Skipping...`);
    } else {
      throw error;
    }
  }
}

async function ensureIntegerAttribute(key, required, min, max, defaultValue) {
  try {
    await databases.createIntegerAttribute(DB_ID, COLL_ID, key, required, min, max, defaultValue);
    console.log(`✅ Attribute created: ${COLL_ID}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${COLL_ID}.${key} already exists. Skipping...`);
    } else {
      throw error;
    }
  }
}

async function ensureDatetimeAttribute(key, required = false) {
  try {
    await databases.createDatetimeAttribute(DB_ID, COLL_ID, key, required);
    console.log(`✅ Attribute created: ${COLL_ID}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${COLL_ID}.${key} already exists. Skipping...`);
    } else {
      throw error;
    }
  }
}

async function ensureIndex(key, type, attributes) {
  try {
    await databases.createIndex(DB_ID, COLL_ID, key, type, attributes);
    console.log(`✅ Index created: ${COLL_ID}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Index ${COLL_ID}.${key} already exists. Skipping...`);
    } else {
      throw error;
    }
  }
}

async function setup() {
  try {
    await ensureCollection();
    
    // Create Attributes
    await ensureStringAttribute('user_id', 255, true);
    await ensureIntegerAttribute('min_age', false, 0, 150, 18);
    await ensureIntegerAttribute('max_age', false, 0, 150, 99);
    await ensureStringAttribute('pref_details', 1024, false, '');
    
    // Create Timestamps
    await ensureDatetimeAttribute('created_at', false);
    await ensureDatetimeAttribute('updated_at', false);
    
    // Create Unique Index on user_id
    await ensureIndex('age_preferences_user_id_unique', 'unique', ['user_id']);
    
    console.log('🎉 Age Preferences schema setup completed successfully!');
  } catch (e) {
    console.error('❌ Schema setup failed:', e.message);
  }
}

setup();
