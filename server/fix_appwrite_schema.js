import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DB_ID;

async function createAttributes(collectionId, attributes) {
    for (const attr of attributes) {
        try {
            if (attr.type === 'string') {
                await databases.createStringAttribute(DB_ID, collectionId, attr.key, attr.size, attr.required, attr.defaultValue, attr.array);
            } else if (attr.type === 'boolean') {
                await databases.createBooleanAttribute(DB_ID, collectionId, attr.key, attr.required, attr.defaultValue, attr.array);
            }
            console.log(`Created ${attr.key} in ${collectionId}`);
        } catch (e) {
            console.log(`Skipped ${attr.key} in ${collectionId} (${e.message})`);
        }
    }
}

async function run() {
    const stringAttrs = [
        { type: 'string', key: 'badge_type', size: 50, required: false, defaultValue: '', array: false },
        { type: 'boolean', key: 'author_is_verified', required: false, defaultValue: false, array: false },
        { type: 'boolean', key: 'creator_is_verified', required: false, defaultValue: false, array: false },
        { type: 'boolean', key: 'is_verified', required: false, defaultValue: false, array: false },
    ];
    await createAttributes('news', stringAttrs);
    await createAttributes('reels', stringAttrs);
    await createAttributes('admins', stringAttrs);
    console.log("Done updating Appwrite schema!");
}
run();
