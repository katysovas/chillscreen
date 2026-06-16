import 'server-only';

import sizeOf from 'image-size';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { isS3BackdropConfigured, putStageBackdropToS3 } from './s3Backdrop';
import {
  validateBackdropDimensions,
  validateBackdropMimeAndSize,
  STAGE_BACKDROP_LIMITS,
} from './backdropValidation';
import {
  optimizeStageImage,
  STAGE_IMAGE_WEBP_CONTENT_TYPE,
} from './stageImageOptimize';

export { stageBackdropUploadHint, STAGE_BACKDROP_LIMITS } from './backdropValidation';

export function validateBackdropFile(
  file: File | { type: string; size: number },
): string | null {
  return validateBackdropMimeAndSize(file);
}

export function validateBackdropBuffer(
  buffer: Buffer,
  contentType: string,
): string | null {
  const mimeErr = validateBackdropMimeAndSize({ type: contentType, size: buffer.length });
  if (mimeErr) return mimeErr;

  try {
    const dims = sizeOf(buffer);
    if (!dims.width || !dims.height) {
      return 'Could not read image dimensions.';
    }
    return validateBackdropDimensions(dims.width, dims.height);
  } catch {
    return 'Could not read image — try another file.';
  }
}

export function extForMime(type: string): string {
  if (type === STAGE_IMAGE_WEBP_CONTENT_TYPE) return '.webp';
  if (type === 'image/png') return '.png';
  if (type === 'image/webp') return '.webp';
  return '.jpg';
}

export async function prepareStageBackdropForStorage(
  buffer: Buffer,
): Promise<{ buffer: Buffer; contentType: string }> {
  const optimized = await optimizeStageImage(buffer);
  if (optimized.buffer.length > STAGE_BACKDROP_LIMITS.maxBytes) {
    throw new Error(
      `Optimized image is still too large (${Math.ceil(optimized.buffer.length / (1024 * 1024))} MB). `
      + 'Try a smaller source file.',
    );
  }
  const dimErr = validateBackdropDimensions(optimized.width, optimized.height);
  if (dimErr) throw new Error(dimErr);
  return { buffer: optimized.buffer, contentType: optimized.contentType };
}

async function saveStageBackdropLocal(
  slug: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const ext = extForMime(contentType);
  const dir = join(process.cwd(), 'public', 'uploads', 'stages');
  await mkdir(dir, { recursive: true });
  const filename = `${slug}${ext}`;
  await writeFile(join(dir, filename), buffer);
  return `/uploads/stages/${filename}`;
}

/**
 * Persist a City template backdrop.
 * Uses S3 when `S3_STAGE_BACKDROP_BUCKET` + `AWS_REGION` are set; otherwise local `public/uploads/stages/`.
 */
export async function saveStageBackdrop(
  slug: string,
  buffer: Buffer,
  _contentType: string,
): Promise<string> {
  const { buffer: webp, contentType } = await prepareStageBackdropForStorage(buffer);
  const ext = extForMime(contentType);
  if (isS3BackdropConfigured()) {
    return putStageBackdropToS3(slug, webp, contentType, ext);
  }
  return saveStageBackdropLocal(slug, webp, contentType);
}

export function withCacheBust(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${Date.now()}`;
}
