import { Storage, Client, ID } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5');
  
client.setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

async function createStorage() {
  try {
    const bucket = await storage.createBucket('alok_media', 'ALOK Media', [
      'read("any")'
    ], false, true, 200000000, ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'avi']);
    console.log('✅ Appwrite Storage Bucket Created! Bucket ID:', bucket.$id);
  } catch (error) {
    if (error.code === 409) {
      console.log('✅ Appwrite Storage Bucket "alok_media" already exists.');
    } else {
      console.error('❌ Error creating bucket:', error.message);
    }
  }
}
createStorage();
