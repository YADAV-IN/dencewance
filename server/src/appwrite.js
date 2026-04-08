import { Client, Databases, Storage, Users, Query, ID } from 'node-appwrite';

// You will need to add this to your server's .env:
// APPWRITE_API_KEY=your_secret_api_key

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '69d60fbe002bae1e32d5');

if (process.env.APPWRITE_API_KEY) {
  client.setKey(process.env.APPWRITE_API_KEY);
} else {
  console.warn('⚠️ WARNING: APPWRITE_API_KEY is not set in .env! Backend operations will fail.');
}

export const databases = new Databases(client);
export const storage = new Storage(client);
export const users = new Users(client);

// Project specific IDs
export const APPWRITE_DB_ID = process.env.APPWRITE_DB_ID || '69d60fe8000c9bd92750';

export { Query, ID };