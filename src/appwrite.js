import { Client, Account, Databases } from "appwrite";

// Use environment variables; fall back to defaults
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || "69d60fbe002bae1e32d5";

console.log("[Appwrite] Endpoint:", APPWRITE_ENDPOINT);
console.log("[Appwrite] Project ID:", APPWRITE_PROJECT_ID);

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
