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

    // Check if API_URL is configured
    if (!API_URL || API_URL === '' || API_URL === 'http://localhost:4000') {
        console.warn('VITE_API_URL is not configured or using default localhost. Attempting direct Appwrite upload...');
    }

    // If we have a valid API URL (not localhost default), use backend upload as primary method
    // Backend upload is more reliable as it handles authentication and CORS properly
    if (API_URL && API_URL !== '' && API_URL !== 'http://localhost:4000') {
        try {
            console.log('Uploading via backend API:', `${API_URL}/api/uploads/media`);
            return await uploadViaBackend(file, token, onProgress);
        } catch (backendErr) {
            console.warn('Backend upload failed:', backendErr.message || backendErr);
            // Fall through to try direct Appwrite
        }
    }

    // Try direct Appwrite upload as fallback
    try {
        console.log('Attempting direct Appwrite upload...');
        const targetBucket = bucketId || 'alok_media';
        const result = await appwriteStorage.createFile(targetBucket, ID.unique(), file);
        const viewUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${targetBucket}/files/${result.$id}/view?project=69d60fbe002bae1e32d5`;
        if (onProgress) onProgress({ progress: 100 });
        console.log('Direct Appwrite upload success!');
        return viewUrl;
    } catch (appwriteErr) {
        console.error('Direct Appwrite upload failed:', appwriteErr.message || appwriteErr);
        throw new Error('Upload failed. Please ensure VITE_API_URL is configured correctly in .env.production. Error: ' + (appwriteErr.message || 'Unknown error'));
    }
};

// Backend upload helper function
async function uploadViaBackend(file, token, onProgress) {
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
                    if (response.data?.url) {
                        console.log('Backend upload success! URL:', response.data.url);
                        resolve(response.data.url);
                    } else {
                        reject(new Error('Invalid response from server: missing URL'));
                    }
                } else if (xhr.status === 401) {
                    reject(new Error('Your login session expired. Please login again and retry.'));
                } else {
                    reject(new Error(response.error || `Upload failed with status ${xhr.status}`));
                }
            } catch (e) {
                reject(new Error('Failed to parse server response: ' + (xhr.responseText || '').substring(0, 200)));
            }
        });

        xhr.addEventListener('error', (e) => {
            console.error('XHR Error:', e);
            reject(new Error('Network error during upload. Please check if the backend API is accessible.'));
        });
        xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')));

        xhr.open('POST', `${API_URL}/api/uploads/media`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
}
