import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69d60fbe002bae1e32d5')
    .setKey(process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

async function run() {
    const dbId = '673dfa1bb56499df5e90';
    const collId = 'admins';
    try {
        console.log('Adding username...');
        await databases.createStringAttribute(dbId, collId, 'username', 255, false);
        console.log('Added username.');
    } catch (e) { console.log('username:', e.message); }

    try {
        console.log('Adding avatar_url...');
        await databases.createUrlAttribute(dbId, collId, 'avatar_url', false);
        console.log('Added avatar_url.');
    } catch (e) { console.log('avatar_url:', e.message); }

    try {
        console.log('Adding name...');
        await databases.createStringAttribute(dbId, collId, 'name', 255, false);
        console.log('Added name.');
    } catch (e) { console.log('name:', e.message); }
    
    try {
        console.log('Adding bio...');
        await databases.createStringAttribute(dbId, collId, 'bio', 5000, false);
        console.log('Added bio.');
    } catch (e) { console.log('bio:', e.message); }
}

run().then(() => console.log('Done'));
