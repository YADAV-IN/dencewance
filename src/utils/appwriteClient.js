import { Client, Storage, ID } from 'appwrite';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69d60fbe002bae1e32d5'); // From your Backend ENV

export const appwriteStorage = new Storage(client);
export { ID };

const resolveApiBase = () => {
    const configured = String(import.meta.env.VITE_API_URL || '').trim();
    if (configured) {
        const normalized = configured.replace(/\/+$/, '');
        const lower = normalized.toLowerCase();
        if (lower.includes('cloud.appwrite.io/v1') || /\/v1$/.test(lower)) {
            console.warn('VITE_API_URL points to Appwrite endpoint. Skipping backend upload URL and using Appwrite SDK upload fallback.');
            return '';
        }
        return normalized;
    }
    if (typeof window !== 'undefined' && window.location && !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
        return '';
    }
    return 'http://localhost:4000';
};

const API_URL = resolveApiBase();
const UPLOAD_ENDPOINT = API_URL ? `${API_URL}/api/uploads/media` : '/api/uploads/media';

export const uploadMediaToAppwrite = async (file, bucketId, onProgress, preferredStorage) => {
    const token = localStorage.getItem('adminToken') || '';
    const storagePreference = preferredStorage || localStorage.getItem('preferredStorage') || 'auto';

    const uploadViaBackend = () => new Promise((resolve, reject) => {
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

        xhr.open('POST', UPLOAD_ENDPOINT);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });

    const uploadViaAppwrite = async () => {
        const targetBucket = bucketId || 'alok_media';
        const result = await appwriteStorage.createFile({
            bucketId: targetBucket,
            fileId: ID.unique(),
            file
        });
        const viewUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${targetBucket}/files/${result.$id}/view?project=69d60fbe002bae1e32d5`;
        if (onProgress) onProgress({ progress: 100 });
        return viewUrl;
    };

    const tryBackendFirst = storagePreference !== 'appwrite';
    const attempts = tryBackendFirst
        ? [uploadViaBackend, uploadViaAppwrite]
        : [uploadViaAppwrite, uploadViaBackend];

    let lastError = null;
    for (const attempt of attempts) {
        try {
            return await attempt();
        } catch (error) {
            lastError = error;
            console.warn('Upload attempt failed:', error?.message || error);
        }
    }
    throw (lastError || new Error('Upload failed.'));
};
