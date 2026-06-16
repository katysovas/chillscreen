/** Built-in City template backdrops — files live in public/images/stages/. */
export const STAGE_WALLPAPER_BASE = '/images/stages';

export type StageWallpaperDef = {
  id: string;
  label: string;
  file: string;
};

export const STAGE_WALLPAPERS: StageWallpaperDef[] = [
  { id: 'skyline', label: 'Urban Skyline', file: 'skyline.webp' },
  { id: 'city', label: 'City Lights', file: 'city.webp' },
  { id: 'beach', label: 'Beach Sunset', file: 'beach.webp' },
  { id: 'concert', label: 'Festival Concert', file: 'concert.webp' },
  { id: 'night_concert', label: 'Night Concert', file: 'night_concert.webp' },
  { id: 'stage_lights', label: 'Stage Lights', file: 'stage_lights.webp' },
  { id: 'dj', label: 'DJ Night', file: 'dj.webp' },
  { id: 'dj_2', label: 'DJ Booth', file: 'dj_2.webp' },
  { id: 'trippy', label: 'Trippy Vibes', file: 'trippy.webp' },
  { id: 'trippy_2', label: 'Neon Trip', file: 'trippy_2.webp' },
  { id: 'space', label: 'Deep Space', file: 'space.webp' },
];

const WALLPAPER_BY_ID = new Map(STAGE_WALLPAPERS.map(w => [w.id, w]));
const WALLPAPER_BY_SRC = new Map<string, StageWallpaperDef>();

for (const wallpaper of STAGE_WALLPAPERS) {
  WALLPAPER_BY_SRC.set(stageWallpaperSrc(wallpaper), wallpaper);
  const legacyFile = wallpaper.file.replace(/\.webp$/i, '.jpg');
  if (legacyFile !== wallpaper.file) {
    WALLPAPER_BY_SRC.set(`${STAGE_WALLPAPER_BASE}/${legacyFile}`, wallpaper);
  }
}

export function stageWallpaperSrc(wallpaper: StageWallpaperDef): string {
  return `${STAGE_WALLPAPER_BASE}/${wallpaper.file}`;
}

export const DEFAULT_STAGE_WALLPAPER = STAGE_WALLPAPERS[0]!;
export const DEFAULT_STAGE_WALLPAPER_URL = stageWallpaperSrc(DEFAULT_STAGE_WALLPAPER);

export function stageWallpaperById(id: string): StageWallpaperDef | null {
  return WALLPAPER_BY_ID.get(id.trim().toLowerCase()) ?? null;
}

/** Strip cache-bust query and hash for comparisons. */
export function normalizeBackdropPath(url: string): string {
  return url.split('?')[0]?.split('#')[0] ?? url;
}

/** Resolve stored preset paths (including legacy .jpg) to the current WebP asset. */
export function stageBackdropDisplayUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const id = resolvePresetWallpaperId(url);
  if (id) {
    const wallpaper = stageWallpaperById(id);
    if (wallpaper) return stageWallpaperSrc(wallpaper);
  }
  return url;
}

export function isPresetStageWallpaperUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return WALLPAPER_BY_SRC.has(normalizeBackdropPath(url));
}

export function resolvePresetWallpaperId(url: string | null | undefined): string | null {
  if (!url) return null;
  return WALLPAPER_BY_SRC.get(normalizeBackdropPath(url))?.id ?? null;
}

/**
 * Owner PATCH / create — preset gallery path, or null for built-in default skyline.
 * Returns undefined when field omitted.
 */
export function parsePresetBackdropUrl(
  raw: unknown,
): string | null | undefined | 'invalid' {
  if (raw === undefined) return undefined;
  if (raw === null || raw === '') return null;
  const base = normalizeBackdropPath(String(raw).trim());
  if (!base) return null;
  const wallpaper = WALLPAPER_BY_SRC.get(base);
  if (wallpaper) return stageWallpaperSrc(wallpaper);
  return 'invalid';
}
