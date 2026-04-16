import 'dotenv/config';
import { databases, APPWRITE_DB_ID } from './src/appwrite.js';

const DB = APPWRITE_DB_ID;
const collectionsToClear = ['reels', 'news', 'status', 'comments', 'saved_reels'];

async function clearJunk() {
  console.log(`Starting cleanup of Appwrite Database: ${DB}`);
  
  for (const col of collectionsToClear) {
    let hasMore = true;
    let count = 0;
    while (hasMore) {
      try {
        const result = await databases.listDocuments(DB, col);
        if (result.documents.length === 0) {
          hasMore = false;
          console.log(`✅ Collection [${col}] is empty.`);
          break;
        }

        for (const doc of result.documents) {
          await databases.deleteDocument(DB, col, doc.$id);
          count++;
        }
        console.log(`Deleted ${count} documents from [${col}] so far...`);
      } catch (err) {
        console.error(`❌ Failed to clear [${col}]:`, err.message);
        hasMore = false;
      }
    }
  }
  
  console.log('🎉 Cleanup absolute finish!');
}

clearJunk().then(() => process.exit(0)).catch(()=>process.exit(1));
