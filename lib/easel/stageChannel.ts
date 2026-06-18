import { stageChannelForRoute } from '@/lib/isolatedCity';
import { getUserStageBySlug } from '@/lib/stages/db';
import {
  DEFAULT_STAGE_PRESET,
  normalizeStagePresetId,
  venueRouteForStagePreset,
} from '@/lib/stages/presets';
import type { StageChannel } from '@/lib/stageVideos';
import type { VenueRoute } from '@/lib/venueSlugs';
import { parseVenueSlug } from '@/lib/venueSlugs';

/** Sync — client has layout route from creator preset / venue page. */
export function easelChannelForStageSlugSync(
  stageSlug: string,
  layoutRoute?: VenueRoute | null,
): StageChannel {
  const route = parseVenueSlug(stageSlug) ?? layoutRoute;
  if (route) return stageChannelForRoute(route);
  return 'cinema';
}

/** Server — resolve creator `/watch/{slug}` preset when slug is not a venue path. */
export async function easelChannelForStageSlug(stageSlug: string): Promise<StageChannel> {
  const route = parseVenueSlug(stageSlug);
  if (route) return stageChannelForRoute(route);

  try {
    const row = await getUserStageBySlug(stageSlug);
    if (row && !row.taken_down_at) {
      const preset = normalizeStagePresetId(row.preset) ?? DEFAULT_STAGE_PRESET;
      return stageChannelForRoute(venueRouteForStagePreset(preset));
    }
  } catch {
    /* no db in dev */
  }

  return 'cinema';
}
