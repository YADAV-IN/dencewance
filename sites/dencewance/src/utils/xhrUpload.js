export const uploadFileWithProgress = (url, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    
    // Fix: Do not set Content-Type if it causes CORS preflight issues or signature mismatches
    // The AWS SDK usually signs exactly what you send. If the pre-signed URL was generated for a specific content type it must match exactly, but let's see. 
    xhr.setRequestHeader('Content-Type', file.type);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        if (onProgress) onProgress(percentComplete);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        const errMsg = xhr.responseText.substring(0, 100);
        reject(new Error(`Upload failed with status ${xhr.status} - ${errMsg}`));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error during upload (Make sure Cloudflare R2 CORS is configured)'));
    };
    
    xhr.send(file);
  });
};
