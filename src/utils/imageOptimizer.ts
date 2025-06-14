interface ImageDimensions {
  width: number;
  height: number;
}

export async function optimizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const optimizedDataUrl = compressImage(img, calculateOptimalDimensions(img));
        resolve(optimizedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function calculateOptimalDimensions(img: HTMLImageElement): ImageDimensions {
  const MAX_WIDTH = 2400;
  const MAX_HEIGHT = 2400;
  
  let width = img.width;
  let height = img.height;
  
  // Calculate aspect ratio
  const aspectRatio = width / height;
  
  // Resize if larger than maximum dimensions while maintaining aspect ratio
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    if (aspectRatio > 1) {
      // Image is wider than tall
      width = Math.min(width, MAX_WIDTH);
      height = width / aspectRatio;
    } else {
      // Image is taller than wide
      height = Math.min(height, MAX_HEIGHT);
      width = height * aspectRatio;
    }
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

function compressImage(img: HTMLImageElement, dimensions: ImageDimensions): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas dimensions to the optimized size
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw image with optimized dimensions
  ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
  
  // Convert to WebP if supported, otherwise fall back to PNG
  try {
    const webpData = canvas.toDataURL('image/webp', 0.9);
    if (webpData.startsWith('data:image/webp')) {
      return webpData;
    }
  } catch (e) {
    console.log('WebP not supported, falling back to PNG');
  }
  
  // Fallback to PNG with high quality
  return canvas.toDataURL('image/png', 1.0);
} 