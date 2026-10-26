import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface ImageSize {
  width: number;
  height: number;
}

const cache = new Map<string, ImageSize>();

/**
 * The pixel size of an image that lives in `public/` (an upload or a bundled picture), or null for
 * anything else. Pages use it to reserve the right space before a picture loads, so nothing jumps
 * and scroll-in animations still see a real box.
 */
export async function getImageSize(url: string): Promise<ImageSize | null> {
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  let rel: string;
  try {
    rel = decodeURIComponent(url.split('?')[0]);
  } catch {
    return null;
  }
  const publicDir = path.join(process.cwd(), 'public');
  const file = path.join(publicDir, rel);
  if (!file.startsWith(publicDir + path.sep)) return null; // never read outside public/

  try {
    const mtime = fs.statSync(file).mtimeMs;
    const key = `${file}:${mtime}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const { width, height } = await sharp(file).metadata();
    if (!width || !height) return null;
    const size = { width, height };
    cache.set(key, size);
    return size;
  } catch {
    return null;
  }
}
