import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function test() {
  try {
     console.log("Checking DB...");
     const ds = await databases.listDocuments('69d60fe8000c9bd92750', '69d6126a0031232a50d0');
     console.log("Docs found:", ds.total);
  } catch(e) { console.error(e.message) }
}
test()
