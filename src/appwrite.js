import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://nyc.cloud.appwrite.io/v1")
    .setProject("69d60fbe002bae1e32d5");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
