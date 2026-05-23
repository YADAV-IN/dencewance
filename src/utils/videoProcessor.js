/**
 * Video Processor — Client-side video validation, metadata extraction & thumbnail generation
 */

const MAX_FILE_SIZE_MB = 100;
const MAX_DURATION_SEC = 300; // 5 minutes
const SUPPORTED_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];

/**
 * Validate a video file before upload
 * @param {File} file 
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateVideo(file) {
  const errors = [];
  const warnings = [];

  if (!file) {
    errors.push('No file selected');
    return { valid: false, errors, warnings };
  }

  // File size check
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    errors.push(`File size (${sizeMB.toFixed(1)}MB) exceeds ${MAX_FILE_SIZE_MB}MB limit`);
  }

  // Format check
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    warnings.push(`Unsupported format: ${file.type}. Supported: MP4, WebM, MOV`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Extract video metadata (duration, resolution, codec)
 * @param {File} file 
 * @returns {Promise<{ duration: number, width: number, height: number, aspectRatio: string }>}
 */
export function extractVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const meta = {
        duration: Math.round(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: `${video.videoWidth}:${video.videoHeight}`,
      };
      URL.revokeObjectURL(url);
      
      if (meta.duration > MAX_DURATION_SEC) {
        meta.warning = `Video is ${Math.round(meta.duration / 60)}min long (max ${MAX_DURATION_SEC / 60}min)`;
      }
      if (meta.height < 720) {
        meta.warning = (meta.warning ? meta.warning + '. ' : '') + `Low resolution (${meta.height}p). Recommended: 720p+`;
      }
      
      resolve(meta);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read video metadata'));
    };
  });
}

/**
 * Generate a thumbnail from the video at a given time (default: 1 second)
 * @param {File} file 
 * @param {number} time - Seconds into the video
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export function generateThumbnail(file, time = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      video.currentTime = Math.min(time, video.duration * 0.1);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to generate thumbnail'));
    };
  });
}

/**
 * Processing stages for UI display
 */
export const PROCESSING_STAGES = [
  { id: 'validating', label: '🔍 Analyzing video...', duration: 800 },
  { id: 'processing', label: '⚡ Processing & optimizing...', duration: 1500 },
  { id: 'thumbnail', label: '🖼️ Generating thumbnail...', duration: 1000 },
  { id: 'uploading', label: '📤 Uploading to cloud...', duration: 0 }, // Dynamic
  { id: 'finalizing', label: '✨ Finalizing...', duration: 500 },
];

/**
 * Run the full processing pipeline
 * @param {File} file
 * @param {function} onStageChange - (stage, progress) callback
 * @returns {Promise<{ metadata: object, thumbnail: string|null, validation: object }>}
 */
export async function processVideo(file, onStageChange = () => {}) {
  let thumbnail = null;

  // Stage 1: Validate
  onStageChange(PROCESSING_STAGES[0], 10);
  const validation = validateVideo(file);
  await sleep(PROCESSING_STAGES[0].duration);

  if (!validation.valid) {
    return { metadata: null, thumbnail: null, validation };
  }

  // Stage 2: Extract metadata
  onStageChange(PROCESSING_STAGES[1], 30);
  let metadata = {};
  try {
    metadata = await extractVideoMetadata(file);
  } catch (e) {
    metadata = { duration: 0, width: 0, height: 0, aspectRatio: 'unknown' };
  }
  await sleep(PROCESSING_STAGES[1].duration);

  // Stage 3: Generate thumbnail
  onStageChange(PROCESSING_STAGES[2], 50);
  try {
    thumbnail = await generateThumbnail(file);
  } catch (e) {
    thumbnail = null;
  }
  await sleep(Math.max(0, PROCESSING_STAGES[2].duration - 500));

  // Stage 4: Ready for upload (caller handles actual upload)
  onStageChange(PROCESSING_STAGES[3], 60);

  return { metadata, thumbnail, validation };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
