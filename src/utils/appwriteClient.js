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

    const pref = preferredStorage || localStorage.getItem('preferredStorage') || (token ? 'r2' : 'backend');

    // Helper: capture a thumbnail from a video file
    const captureVideoThumbnail = (videoFile) => new Promise((resolve, reject) => {
        try {
            const url = URL.createObjectURL(videoFile);
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = url;
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';
            video.addEventListener('loadeddata', () => {
                // Seek to 0.5s or 0
                const seekTo = Math.min(0.5, Math.max(0, (video.duration || 0) * 0.05));
                const onSeek = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth || 640;
                        canvas.height = video.videoHeight || 360;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob((blob) => {
                            URL.revokeObjectURL(url);
                            if (blob) resolve(blob);
                            else reject(new Error('Failed to create thumbnail blob'));
                        }, 'image/jpeg', 0.85);
                    } catch (err) { reject(err); }
                };
                video.currentTime = seekTo;
                video.addEventListener('seeked', onSeek, { once: true });
            }, { once: true });
            video.addEventListener('error', (e) => { URL.revokeObjectURL(url); reject(new Error('Video load error')); }, { once: true });
        } catch (e) { reject(e); }
    });

    // If video, try to capture and upload a thumbnail first (best-effort)
    let coverUrl = null;
    if (file && file.type && file.type.startsWith && file.type.startsWith('video/')) {
        try {
            const thumbBlob = await captureVideoThumbnail(file);
            const form = new FormData();
            form.append('media', thumbBlob, (file.name || 'thumb') + '.jpg');
            const thumbHeaders = {};
            if (token) thumbHeaders.Authorization = `Bearer ${token}`;
            const thumbResp = await fetch(`${API_URL}/api/uploads/media`, {
                method: 'POST',
                headers: thumbHeaders,
                body: form
            });
            if (thumbResp.ok) {
                const thumbData = await thumbResp.json();
                if (thumbData?.data?.url) coverUrl = thumbData.data.url;
            }
        } catch (e) {
            console.warn('Thumbnail capture/upload failed:', e.message || e);
        }
    }

    // Try R2 presigned if allowed
    if (token && (pref === 'r2' || pref === 'auto')) {
        try {
            const signResponse = await fetch(`${API_URL}/api/uploads/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream' })
            });
            if (signResponse.ok) {
                const signData = await signResponse.json();
                if (signData?.uploadUrl && signData?.publicUrl) {
                    await uploadFileWithProgress(signData.uploadUrl, file, (progress) => { if (onProgress) onProgress({ progress }); });
                    return { url: signData.publicUrl, cover_url: coverUrl };
                }
            }
        } catch (e) { console.warn('R2 presign failed', e.message || e); }
    }

    // Try Appwrite client
    if (token && (pref === 'appwrite' || pref === 'auto')) {
        try {
            const targetBucket = bucketId || 'alok_media';
            const result = await appwriteStorage.createFile(targetBucket, ID.unique(), file);
            const viewUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${targetBucket}/files/${result.$id}/view?project=69d60fbe002bae1e32d5`;
            if (onProgress) onProgress({ progress: 100 });
            return { id: result.$id, url: viewUrl, cover_url: coverUrl };
        } catch (e) { console.warn('Appwrite upload failed', e.message || e); }
    }

    // Fallback to backend upload (XHR for progress)
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('media', file);
        if (coverUrl) formData.append('cover_url', coverUrl);

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
                    if (response.data?.url) resolve({ url: response.data.url, cover_url: response.data.cover_url || coverUrl });
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
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
    });
};
