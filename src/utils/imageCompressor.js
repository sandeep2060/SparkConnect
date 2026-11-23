/**
 * Client-Side Fast Image Compressor for SparkConnect
 * Downscales photos from mobile/desktop gallery to web-optimized JPEG data URLs (~80KB - 200KB).
 * Prevents network payload timeouts and ensures instant delivery in chat and profile updates.
 */
export const compressImageForUpload = (file, maxDimension = 1280, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));

    // Non-image files or SVG/GIF pass-through
    if (!file.type || !file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width || 1200;
        let height = img.height || 900;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(readerEvent.target.result);
        }
      };
      img.onerror = () => {
        resolve(readerEvent.target.result);
      };
      img.src = readerEvent.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
