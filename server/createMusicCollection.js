import 'dotenv/config';
import { Client, Databases, Permission, Role } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function createMusicCollection() {
  try {
    const dbId = process.env.APPWRITE_DB_ID;
    const collectionId = 'music_tracks';
    
    // Create collection
    console.log('Creating collection...');
    await databases.createCollection(
      dbId, 
      collectionId, 
      'Music Tracks',
      [
        Permission.read(Role.any()),
        Permission.write(Role.users())
      ]
    );

    // Create attributes
    console.log('Creating attributes...');
    await databases.createStringAttribute(dbId, collectionId, 'title', 255, true);
    await databases.createStringAttribute(dbId, collectionId, 'artist', 255, true);
    await databases.createUrlAttribute(dbId, collectionId, 'audio_url', true);
    await databases.createUrlAttribute(dbId, collectionId, 'cover_url', false);
    await databases.createIntegerAttribute(dbId, collectionId, 'duration', false);
    await databases.createStringAttribute(dbId, collectionId, 'category', 255, false);
    await databases.createBooleanAttribute(dbId, collectionId, 'trending', false, false);
    await databases.createBooleanAttribute(dbId, collectionId, 'is_active', false, true);
    
    console.log('Music collection created successfully!');
  } catch (err) {
    console.error('Failed to create collection:', err);
  }
}

createMusicCollection();
