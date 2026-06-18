import { stagePresetById } from '@/lib/stages/presets';
import type { UserStagePublic } from '@/lib/stages/types';
import { stageBackdropDisplayUrl } from '@/lib/stages/wallpapers';
import type { FeaturedChartEntry } from '@/lib/stages/featuredStagesChart';

const PRESET_THUMB: Record<string, string> = {
  cinema: '/images/homepage/cinema.webp',
  chill: '/images/homepage/forest.webp',
  live: '/images/homepage/forest.webp',
  forest: '/images/homepage/forest.webp',
  thedesert: '/images/homepage/thedesert.webp',
  thefarm: '/images/homepage/thefarm.webp',
  'silent-disco': '/images/homepage/silentdisco.webp',
};

export function creatorStageForChartEntry(entry: FeaturedChartEntry): string | null {
  return entry.target.kind === 'creator' ? entry.target.slug : null;
}

export function resolvedChartEntryName(
  entry: FeaturedChartEntry,
  stage: UserStagePublic | null | undefined,
): string {
  if (stage?.displayName?.trim()) return stage.displayName.trim();
  if (entry.name?.trim()) return entry.name.trim();
  const slug = creatorStageForChartEntry(entry);
  if (slug) {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return 'Stage';
}

export function resolvedChartEntrySubtitle(
  entry: FeaturedChartEntry,
  stage: UserStagePublic | null | undefined,
): string {
  if (stage?.description?.trim()) return stage.description.trim();
  if (entry.subtitle?.trim()) return entry.subtitle.trim();
  const tagline = stage ? stagePresetById(stage.preset)?.tagline : null;
  return tagline?.trim() ?? '';
}

export function resolvedChartEntryThumbnail(
  entry: FeaturedChartEntry,
  stage: UserStagePublic | null | undefined,
): string {
  const backdrop = stageBackdropDisplayUrl(stage?.backdropUrl);
  if (backdrop?.trim()) return backdrop;
  if (entry.thumbnail?.trim()) return entry.thumbnail;
  if (stage) return PRESET_THUMB[stage.preset] ?? '/images/homepage/edc.webp';
  return '/images/homepage/edc.webp';
}
