// Browser-only: decode, downscale and re-encode an image to WebP. Falls back to the original file.
import { MAX_EDGE, WEBP_QUALITY, WEBP_TYPE, targetSize } from './image-resize';

export type Prepared = { file: File | Blob; name: string; reencoded: boolean };

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, WEBP_TYPE, WEBP_QUALITY));
}

/**
 * Returns a WebP blob (long edge <= MAX_EDGE) smaller than the original, or null when the image cannot be
 * decoded/encoded or the result is not smaller (callers then upload the original).
 */
export async function reencodeToWebp(file: File, maxBytes: number): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = targetSize(bitmap.width, bitmap.height, MAX_EDGE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const out = await toBlob(canvas);
    if (!out || out.type !== WEBP_TYPE || out.size > maxBytes || out.size >= file.size) return null;
    return out;
  } catch {
    return null;
  }
}
