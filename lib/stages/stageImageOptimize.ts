import sharp from 'sharp';
import { STAGE_BACKDROP_LIMITS } from './backdropValidation';

export const STAGE_IMAGE_WEBP_QUALITY = 82;
export const STAGE_IMAGE_WEBP_CONTENT_TYPE = 'image/webp';

export type OptimizedStageImage = {
  buffer: Buffer;
  contentType: typeof STAGE_IMAGE_WEBP_CONTENT_TYPE;
  width: number;
  height: number;
};

/** Resize wide backdrops and encode as WebP for stage gallery + uploads. */
export async function optimizeStageImage(input: Buffer): Promise<OptimizedStageImage> {
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) {
    throw new Error('Could not read image dimensions.');
  }

  let pipeline = sharp(input);
  const maxW = STAGE_BACKDROP_LIMITS.recommendedWidth;
  if (meta.width > maxW) {
    pipeline = pipeline.resize({ width: maxW, withoutEnlargement: true });
  }

  const buffer = await pipeline
    .webp({
      quality: STAGE_IMAGE_WEBP_QUALITY,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer();

  const outMeta = await sharp(buffer).metadata();
  return {
    buffer,
    contentType: STAGE_IMAGE_WEBP_CONTENT_TYPE,
    width: outMeta.width ?? meta.width,
    height: outMeta.height ?? meta.height,
  };
}
