import { Client, Storage, ID } from 'appwrite';
import { uploadFileWithProgress } from './xhrUpload.js';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69d60fbe002bae1e32d5'); // From your Backend ENV

export const appwriteStorage = new Storage(client);
export { ID };

// Use backend API endpoint for uploads (avoids CORS & Appwrite limitations)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const uploadMediaToAppwrite = async (file, bucketId, onProgress) => {
    const token = localStorage.getItem('adminToken') || '';
    if (!token) throw new Error('You must be logged in to upload. Please login first.');

    // Try direct Appwrite upload first so browser-side R2 CORS never blocks upload.
    try {
        console.log('Attempting direct Appwrite upload...');
        const targetBucket = bucketId || 'alok_media';
        const result = await appwriteStorage.createFile(targetBucket, ID.unique(), file);
        const viewUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${targetBucket}/files/${result.$id}/view?project=69d60fbe002bae1e32d5`;
        if (onProgress) onProgress({ progress: 100 });
        console.log('Direct Appwrite upload success!');
        return viewUrl;
    } catch (appwriteErr) {
        console.warn('Direct Appwrite upload failed:', appwriteErr.message || appwriteErr);
    }

    // Fallback to backend upload if Appwrite cannot be used.
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('media', file);

        const xhr = new XMLHttpRequest();

        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onProgress({ progress: (e.loaded / e.total) * 100 });
                }
            });
        }

        xhr.addEventListener('load', () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (response.data?.url) resolve(response.data.url);
                    else reject(new Error('Invalid response from server'));
                } else if (xhr.status === 401) {
                    reject(new Error('Your login session expired. Please login again and retry.'));
                } else {
                    reject(new Error(response.error || `Upload failed with status ${xhr.status}`));
                }
            } catch (e) {
                reject(new Error('Failed to parse server response.'));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
        xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')));

        xhr.open('POST', `${API_URL}/api/uploads/media`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
};
