import { Client, Databases, Storage } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('67420cff00078b5e40c4')

const databases = new Databases(client);

async function test() {
  try {
     console.log("Checking DB...");
     const ds = await databases.listDocuments('69d60fe8000c9bd92750', '69d6126a0031232a50d0');
     console.log(ds.total);
  } catch(e) { console.error(e.message) }
}
test()
