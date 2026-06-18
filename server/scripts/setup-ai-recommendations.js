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

async function ensureCollection(id, name) {
  try {
    await databases.createCollection(DB_ID, id, name);
    console.log(`✅ Collection created: ${name}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Collection ${name} already exists.`);
    } else {
      throw error;
    }
  }
}

async function ensureStringAttribute(collId, key, size, required, defaultValue) {
  try {
    await databases.createStringAttribute(DB_ID, collId, key, size, required, defaultValue);
    console.log(`✅ Attribute created: ${collId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${collId}.${key} already exists. Skipping...`);
    } else {
      throw error;
    }
  }
}

async function ensureIntegerAttribute(collId, key, required, min, max, defaultValue) {
  try {
    await databases.createIntegerAttribute(DB_ID, collId, key, required, min, max, defaultValue);
    console.log(`✅ Attribute created: ${collId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${collId}.${key} already exists. Skipping...`);
    } else {
      throw error;
    }
  }
}

async function ensureFloatAttribute(collId, key, required, min, max, defaultValue) {
  try {
    await databases.createFloatAttribute(DB_ID, collId, key, required, min, max, defaultValue);
    console.log(`✅ Attribute created: ${collId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${collId}.${key} already exists. Skipping...`);
    } else {
      throw error;
    }
  }
}

async function ensureDatetimeAttribute(collId, key, required = false) {
  try {
    await databases.createDatetimeAttribute(DB_ID, collId, key, required);
    console.log(`✅ Attribute created: ${collId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Attribute ${collId}.${key} already exists. Skipping...`);
    } else {
      throw error;
    }
  }
}

async function ensureIndex(collId, key, type, attributes) {
  try {
    await databases.createIndex(DB_ID, collId, key, type, attributes);
    console.log(`✅ Index created: ${collId}.${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`⚠️ Index ${collId}.${key} already exists. Skipping...`);
    } else {
      throw error;
    }
  }
}

async function setup() {
  try {
    console.log('🚀 Setting up AI recommendations DB Schema...');

    // 1. user_activities Setup
    const actColl = 'user_activities';
    await ensureCollection(actColl, 'User Activities');
    await ensureStringAttribute(actColl, 'user_id', 255, true);
    await ensureStringAttribute(actColl, 'action', 50, true);
    await ensureStringAttribute(actColl, 'target_id', 255, true);
    await ensureStringAttribute(actColl, 'target_type', 50, true);
    await ensureStringAttribute(actColl, 'category', 100, false, '');
    await ensureIntegerAttribute(actColl, 'duration', false, 0, 86400, 0);
    await ensureDatetimeAttribute(actColl, 'created_at', false);
    await ensureDatetimeAttribute(actColl, 'updated_at', false);
    await ensureIndex(actColl, 'user_activities_user_id', 'key', ['user_id']);
    await ensureIndex(actColl, 'user_activities_target_id', 'key', ['target_id']);

    // 2. ai_user_profiles Setup
    const profColl = 'ai_user_profiles';
    await ensureCollection(profColl, 'AI User Profiles');
    await ensureStringAttribute(profColl, 'user_id', 255, true);
    await ensureStringAttribute(profColl, 'category_scores', 5000, false, '{}');
    await ensureStringAttribute(profColl, 'creator_scores', 5000, false, '{}');
    await ensureFloatAttribute(profColl, 'exploration_epsilon', false, 0.0, 1.0, 0.2);
    await ensureDatetimeAttribute(profColl, 'created_at', false);
    await ensureDatetimeAttribute(profColl, 'updated_at', false);
    await ensureIndex(profColl, 'ai_user_profiles_user_id_unique', 'unique', ['user_id']);

    // 3. ai_global_feedback Setup
    const feedColl = 'ai_global_feedback';
    await ensureCollection(feedColl, 'AI Global Feedback');
    await ensureStringAttribute(feedColl, 'param_key', 100, true);
    await ensureFloatAttribute(feedColl, 'param_value', true, -1000000.0, 1000000.0, undefined);
    await ensureIntegerAttribute(feedColl, 'feedback_count', false, 0, 2147483647, 0);
    await ensureDatetimeAttribute(feedColl, 'created_at', false);
    await ensureDatetimeAttribute(feedColl, 'updated_at', false);
    await ensureIndex(feedColl, 'ai_global_feedback_param_key_unique', 'unique', ['param_key']);

    console.log('🎉 AI Recommendation schema setup completed successfully!');
  } catch (e) {
    console.error('❌ Schema setup failed:', e.message);
  }
}

setup();
