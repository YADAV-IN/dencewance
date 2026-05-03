import { Databases, Client } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5');
  
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DB_ID || '69d60fe8000c9bd92750';

async function addMissingAttributes() {
  try {
    const list = await databases.listCollections(DB_ID);
    let reelCol = list.collections.find(c => c.$id === 'reels');
    if (reelCol) {
      console.log('Adding missing Reels attributes...');
      const attrs = [
        { func: databases.createStringAttribute.bind(databases), args: [DB_ID, 'reels', 'dedup_key', 255, false, ''] },
        { func: databases.createStringAttribute.bind(databases), args: [DB_ID, 'reels', 'cover_image_url', 1024, false, ''] },
        { func: databases.createStringAttribute.bind(databases), args: [DB_ID, 'reels', 'creator_name', 255, false, 'ALOK Creator'] },
        { func: databases.createStringAttribute.bind(databases), args: [DB_ID, 'reels', 'creator_handle', 255, false, 'alok'] },
        { func: databases.createStringAttribute.bind(databases), args: [DB_ID, 'reels', 'creator_avatar', 1024, false, ''] },
        { func: databases.createStringAttribute.bind(databases), args: [DB_ID, 'reels', 'creator_mode', 50, false, 'auto'] },
        { func: databases.createBooleanAttribute.bind(databases), args: [DB_ID, 'reels', 'is_official_creator', false, false] },
        { func: databases.createBooleanAttribute.bind(databases), args: [DB_ID, 'reels', 'is_demo_creator', false, false] },
        { func: databases.createIntegerAttribute.bind(databases), args: [DB_ID, 'reels', 'follower_count', false, 0, 1000000, 0] },
        { func: databases.createStringAttribute.bind(databases), args: [DB_ID, 'reels', 'tags', 100, false, undefined, true] },
        { func: databases.createBooleanAttribute.bind(databases), args: [DB_ID, 'reels', 'is_active', false, true] },
        { func: databases.createIntegerAttribute.bind(databases), args: [DB_ID, 'reels', 'views', false, 0, 1000000000, 0] }
      ];

      for (let attr of attrs) {
        try {
          await attr.func(...attr.args);
          console.log(`Added attribute successfully!`);
        } catch (e) {
          if (e.code === 409) console.log(`Attribute already exists.`);
          else console.error(`Error adding attribute:`, e.message);
        }
      }
    }
  } catch(e) { console.error('Failed', e); }
}

addMissingAttributes().then(() => console.log('Done!'));
