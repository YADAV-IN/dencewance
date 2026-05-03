import { Client, Storage, ID } from 'node-appwrite'; // Using node-appwrite for test, we can use it to test
const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69d60fbe002bae1e32d5');
const storage = new Storage(client);

async function test() {
  try {
     console.log('Testing Appwrite directly...');
     const res = await storage.listFiles('alok_media', []);
     console.log('List success', res.total);
  } catch (err) {
     console.error('Error:', err.message);
  }
}
test();
