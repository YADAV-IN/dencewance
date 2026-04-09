import { Client, Storage, ID } from 'appwrite';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69d60fbe002bae1e32d5'); // From your Backend ENV

export const appwriteStorage = new Storage(client);
export { ID };

// Use backend API endpoint for uploads (avoids CORS & Appwrite limitations)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://server-kappa-lac.vercel.app');

export const uploadMediaToAppwrite = async (file, bucketId, onProgress) => {
    try {
        // Get admin token from localStorage
        const token = localStorage.getItem('adminToken') || '';
        
        if (!token) {
            throw new Error('You must be logged in to upload. Please login first.');
        }
        
        // Upload via backend API (much more reliable than direct Appwrite client upload)
        const formData = new FormData();
        formData.append('media', file);
        
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onProgress({ progress: (e.loaded / e.total) * 100 });
                }
            });
        }
        
        return new Promise((resolve, reject) => {
            xhr.addEventListener('load', () => {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        if (response.data && response.data.url) {
                            resolve(response.data.url);
                        } else {
                            reject(new Error('Invalid response from server'));
                        }
                    } else if (xhr.status === 401) {
                        reject(new Error('Your login session expired. Please login again and retry.'));
                    } else if (xhr.status === 400) {
                        reject(new Error(response.error || 'Invalid file. Please check the file and try again.'));
                    } else {
                        reject(new Error(response.error || `Upload failed with status ${xhr.status}`));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse server response: ' + (xhr.responseText || 'empty')));
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload - check your internet connection and try again.'));
            });
            
            xhr.addEventListener('abort', () => {
                reject(new Error('Upload was cancelled.'));
            });
            
            xhr.open('POST', `${API_URL}/api/uploads/media`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    } catch(err) {
        throw new Error(err.message || 'Upload failed');
    }
};
