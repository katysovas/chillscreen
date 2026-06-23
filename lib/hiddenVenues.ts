import type { VenueRoute } from '@/lib/venueSlugs';
import type { StageChannel } from '@/lib/stageVideos';

/** Built-in venues omitted from pickers, landing, admin tabs, and nav — routes still work. */
export const HIDDEN_VENUE_ROUTES = ['headliner'] as const satisfies readonly VenueRoute[];

const hiddenRoutes = new Set<VenueRoute>(HIDDEN_VENUE_ROUTES);

export const HIDDEN_VENUE_SLUGS = ['headliner'] as const;

export function isHiddenVenueRoute(route: VenueRoute): boolean {
  return hiddenRoutes.has(route);
}

export function isHiddenStageChannel(channel: StageChannel): boolean {
  return (HIDDEN_VENUE_ROUTES as readonly string[]).includes(channel);
}
