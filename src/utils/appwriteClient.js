import { Client, Storage, ID } from 'appwrite';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69d60fbe002bae1e32d5'); // From your Backend ENV

export const appwriteStorage = new Storage(client);
export { ID };

export const uploadMediaToAppwrite = async (file, bucketId, onProgress) => {
    try {
        const promise = appwriteStorage.createFile(
            bucketId,
            ID.unique(),
            file,
            [], // Permissions, relying on Bucket defaults
            onProgress
        );
        // Promise returns file metadata when done
        const result = await promise;
        return `https://nyc.cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${result.$id}/view?project=69d60fbe002bae1e32d5`;
    } catch(err) {
        throw new Error(err.message || 'Upload directly via Appwrite failed');
    }
};
