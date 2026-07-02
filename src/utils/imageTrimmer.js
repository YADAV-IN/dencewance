/**
 * Utility to automatically trim whitespace or transparent padding from an image.
 * This runs identically to a Python OpenCV bounding-box crop, but entirely client-side
 * for zero-latency execution.
 */
export const trimImageWhitespace = (imageUrl) => {
  return new Promise((resolve) => {
    // If it's a known URL format that we shouldn't touch (like UI avatars or external domains causing CORS), return original
    if (!imageUrl || imageUrl.includes('ui-avatars.com') || imageUrl.includes('dicebear.com')) {
      return resolve(imageUrl);
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        let isBlank = true;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const offset = (y * canvas.width + x) * 4;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            const a = data[offset + 3];

            // Define "blank" as purely transparent OR completely white
            const isWhite = (r > 240 && g > 240 && b > 240);
            const isTransparent = a < 10;

            if (!isWhite && !isTransparent) {
              isBlank = false;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (isBlank) {
          resolve(imageUrl); // Return original if completely blank
          return;
        }

        // Add a small 10px padding around the cropped area
        const padding = 10;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width, maxX + padding);
        maxY = Math.min(canvas.height, maxY + padding);

        const cropWidth = maxX - minX;
        const cropHeight = maxY - minY;

        // If the crop is basically the whole image, skip to save memory
        if (cropWidth >= canvas.width - 20 && cropHeight >= canvas.height - 20) {
          resolve(imageUrl);
          return;
        }

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        const cropCtx = cropCanvas.getContext('2d');
        
        cropCtx.drawImage(
          canvas,
          minX, minY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );

        resolve(cropCanvas.toDataURL('image/png', 0.9));
      } catch (e) {
        // Fallback for CORS issues (tainted canvas)
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
};
