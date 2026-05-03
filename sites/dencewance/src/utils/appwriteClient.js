import { Client, Storage, ID } from 'appwrite';
import { uploadFileWithProgress } from './xhrUpload.js';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69d60fbe002bae1e32d5'); // From your Backend ENV

export const appwriteStorage = new Storage(client);
export { ID };

// Use backend API endpoint for uploads (avoids CORS & Appwrite limitations)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');

export const uploadMediaToAppwrite = async (file, bucketId, onProgress) => {
    const token = localStorage.getItem('adminToken') || '';
    if (!token) throw new Error('You must be logged in to upload. Please login first.');

    // ==========================================
    // BYPASS 1: Try Direct R2 Presigned URL Upload 
    // (Bypasses Vercel 4.5MB limit and Render timeouts)
    // ==========================================
    try {
        console.log('Attempting Bypass 1: Presigned R2 Upload...');
        const signResponse = await fetch(`${API_URL}/api/uploads/sign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type || 'video/mp4'
            })
        });

        if (signResponse.ok) {
            const signData = await signResponse.json();
            if (signData?.uploadUrl && signData?.publicUrl) {
                await uploadFileWithProgress(signData.uploadUrl, file, (progress) => {
                    if (onProgress) onProgress({ progress });
                });
                console.log('Bypass 1 (R2 Direct) Success!');
                return signData.publicUrl;
            }
        } else {
            console.warn('Bypass 1 (R2 Direct) failed: API returned status', signResponse.status);
        }
    } catch (e) {
        console.warn('Bypass 1 (R2 Direct) failed:', e.message);
    }

    // ==========================================
    // BYPASS 2: Try Direct Appwrite Client SDK Upload
    // (Bypasses Backend entirely)
    // ==========================================
    try {
        console.log('Attempting Bypass 2: Direct Appwrite Client Upload...');
        const targetBucket = bucketId || 'alok_media';
        const result = await appwriteStorage.createFile(targetBucket, ID.unique(), file);
        const viewUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${targetBucket}/files/${result.$id}/view?project=69d60fbe002bae1e32d5`;
        if (onProgress) onProgress({ progress: 100 });
        console.log('Bypass 2 (Direct Appwrite) Success!');
        return viewUrl;
    } catch (e) {
        console.warn('Bypass 2 (Direct Appwrite) failed:', e.message);
    }

    // ==========================================
    // FALLBACK 3: Old Backend POST Method
    // ==========================================
    console.log('Falling back to traditional backend upload...');
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
