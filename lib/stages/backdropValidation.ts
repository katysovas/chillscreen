/**
 * City template backdrop upload limits.
 *
 * Images render with object-fit:cover inside a 2600×900 game tile (≈2.89:1).
 * Recommended size matches that tile 1:1; min width covers 1080p viewports.
 */

/** Matches `CITY_MID_TILE_W` / `CITY_MID_TILE_H` in city/cinema/constants. */
export const STAGE_BACKDROP_TILE_WIDTH = 2600;
export const STAGE_BACKDROP_TILE_HEIGHT = 900;

const TILE_ASPECT = STAGE_BACKDROP_TILE_WIDTH / STAGE_BACKDROP_TILE_HEIGHT;

export const STAGE_BACKDROP_LIMITS = {
  recommendedWidth: STAGE_BACKDROP_TILE_WIDTH,
  recommendedHeight: STAGE_BACKDROP_TILE_HEIGHT,
  /** Sharp on 1080p; still crops acceptably with cover. */
  minWidth: 1920,
  /** Keeps enough vertical detail for the wide tile aspect. */
  minHeight: Math.ceil(1920 / TILE_ASPECT),
  maxBytes: 5 * 1024 * 1024,
  /** Landscape only — roughly 3:2 through ultrawide panorama. */
  minAspectRatio: 1.4,
  maxAspectRatio: 4,
} as const;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function stageBackdropUploadHint(): string {
  const {
    recommendedWidth,
    recommendedHeight,
    minWidth,
    minHeight,
    maxBytes,
  } = STAGE_BACKDROP_LIMITS;
  const maxMb = maxBytes / (1024 * 1024);
    return `Landscape JPG, PNG, or WebP. Best at ${recommendedWidth}×${recommendedHeight}px. `
    + `At least ${minWidth}×${minHeight}px, ${maxMb} MB max. Saved as optimized WebP.`;
}

export function validateBackdropMimeAndSize(
  file: { type: string; size: number },
): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Upload a JPG, PNG, or WebP image.';
  }
  if (file.size > STAGE_BACKDROP_LIMITS.maxBytes) {
    return `Image must be ${STAGE_BACKDROP_LIMITS.maxBytes / (1024 * 1024)} MB or smaller.`;
  }
  return null;
}

export function validateBackdropDimensions(
  width: number,
  height: number,
): string | null {
  const {
    minWidth,
    minHeight,
    minAspectRatio,
    maxAspectRatio,
  } = STAGE_BACKDROP_LIMITS;

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 'Could not read image dimensions.';
  }

  if (height > width) {
    return 'Use a landscape image (width greater than height).';
  }

  const aspect = width / height;
  if (aspect < minAspectRatio) {
    return `Image is too tall — use a wider landscape photo (at least ${minAspectRatio}:1).`;
  }
  if (aspect > maxAspectRatio) {
    return `Image is too wide — use a less extreme panorama (up to ${maxAspectRatio}:1).`;
  }

  if (width < minWidth || height < minHeight) {
    return `Image is too small — at least ${minWidth}×${minHeight}px `
      + `(recommended ${STAGE_BACKDROP_LIMITS.recommendedWidth}×${STAGE_BACKDROP_LIMITS.recommendedHeight}px).`;
  }

  return null;
}

/** Read pixel dimensions in the browser before upload. */
export async function readBackdropImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap !== 'undefined') {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image.'));
    };
    img.src = url;
  });
}

/** Client-side validation — MIME, size, then dimensions. */
export async function validateBackdropFileForUpload(file: File): Promise<string | null> {
  const basic = validateBackdropMimeAndSize(file);
  if (basic) return basic;

  try {
    const { width, height } = await readBackdropImageDimensions(file);
    return validateBackdropDimensions(width, height);
  } catch {
    return 'Could not read image — try another file.';
  }
}
