import type { StagePresetId } from '@/lib/stages/types';
import {
  normalizeBackdropPath,
  resolvePresetWallpaperId,
  STAGE_WALLPAPERS,
  stageWallpaperSrc,
} from '@/lib/stages/wallpapers';

export type StageGalleryOption = {
  id: string;
  label: string;
  tagline?: string;
  thumbSrc: string;
  preset: StagePresetId;
  backdropUrl: string | null;
};

/** City wallpaper picker — Nature / Space hidden for now. */
export const STAGE_GALLERY_OPTIONS: StageGalleryOption[] = STAGE_WALLPAPERS.map(w => ({
  id: `city-${w.id}`,
  label: w.label,
  thumbSrc: stageWallpaperSrc(w),
  preset: 'cinema' as const,
  backdropUrl: stageWallpaperSrc(w),
}));

const GALLERY_BY_ID = new Map(STAGE_GALLERY_OPTIONS.map(o => [o.id, o]));

export const DEFAULT_STAGE_GALLERY_ID = STAGE_GALLERY_OPTIONS[0]!.id;

export function stageGalleryOptionById(id: string): StageGalleryOption | null {
  return GALLERY_BY_ID.get(id) ?? null;
}

export function galleryOptionMatches(
  option: StageGalleryOption,
  preset: StagePresetId,
  backdropUrl: string | null | undefined,
): boolean {
  if (option.preset !== preset) return false;
  if (option.preset === 'cinema') {
    return normalizeBackdropPath(option.backdropUrl ?? '') === normalizeBackdropPath(backdropUrl ?? '');
  }
  return true;
}

export function resolveStageGalleryId(
  preset: StagePresetId,
  backdropUrl: string | null | undefined,
): string | null {
  if (preset !== 'cinema') return null;
  const wpId = resolvePresetWallpaperId(backdropUrl);
  return wpId ? `city-${wpId}` : null;
}

export function isCustomCityGalleryBackdrop(
  preset: StagePresetId,
  backdropUrl: string | null | undefined,
): boolean {
  return preset === 'cinema' && Boolean(backdropUrl) && resolvePresetWallpaperId(backdropUrl) == null;
}
