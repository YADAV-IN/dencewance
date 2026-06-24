import { Client, Storage, ID } from 'appwrite';
import { uploadFileWithProgress } from './xhrUpload.js';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69d60fbe002bae1e32d5'); // From your Backend ENV

export const appwriteStorage = new Storage(client);
export { ID };

// Use backend API endpoint for uploads (avoids CORS & Appwrite limitations)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const uploadMediaToAppwrite = async (file, bucketId, onProgress, preferredStorage) => {
    const token = localStorage.getItem('adminToken') || '';

    // Direct backend XHR upload for fast direct-to-R2 transfer without Appwrite Cloud bottleneck

    // Fallback to backend upload (XHR for progress)
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('media', file);

        const xhr = new XMLHttpRequest();
        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) onProgress({ progress: (e.loaded / e.total) * 100 });
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
            } catch (e) { reject(new Error('Failed to parse server response.')); }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
        xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')));

        xhr.open('POST', `${API_URL}/api/uploads/media`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
};
