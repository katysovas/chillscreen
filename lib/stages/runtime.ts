import type { UserStagePublic } from '@/lib/stages/types';
import { venueRouteForStagePreset } from '@/lib/stages/presets';
import type { VenueRoute } from '@/lib/venueSlugs';

/** URL path prefix for creator-owned stages. */
export const CREATOR_STAGE_PATH_PREFIX = 'watch';

export function stagePathForSlug(slug: string): string {
  return `/${CREATOR_STAGE_PATH_PREFIX}/${slug}`;
}

export function partyRoomIdForStageSlug(slug: string): string {
  return `whichstage-${slug}`;
}

export function venueRouteForUserStage(stage: UserStagePublic): VenueRoute {
  return venueRouteForStagePreset(stage.preset);
}

export function nowPlayingStream(stage: UserStagePublic) {
  if (!stage.streams.length) return null;
  const idx = Math.min(Math.max(0, stage.nowPlayingIndex), stage.streams.length - 1);
  return stage.streams[idx] ?? null;
}

export function stageShareUrl(slug: string, siteUrl?: string): string {
  const base = (siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://whichstage.com').replace(/\/$/, '');
  return `${base}${stagePathForSlug(slug)}`;
}

export function stageShareText(slug: string, siteUrl?: string): string {
  return `Join my stage on WhichStage — ${stageShareUrl(slug, siteUrl)}`;
}
