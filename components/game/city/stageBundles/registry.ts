import type { VenueRoute } from '@/lib/venueRoutes';
import type { StageMidBundleModule } from './types';

/** One dynamic import per venue route — keeps unrelated stage SVG out of the chunk. */
export const STAGE_MID_BUNDLE_LOADERS: Record<
  VenueRoute,
  () => Promise<StageMidBundleModule>
> = {
  'outside-hands': () => import('./outside-hands'),
  cinema: () => import('./cinema'),
  'deep-space': () => import('./deep-space'),
  'seattle-concerts': () => import('./seattle-concerts'),
  edc: () => import('./edc'),
  coachella: () => import('./coachella'),
  tentaroo: () => import('./tentaroo'),
  forest: () => import('./forest'),
  'silent-disco': () => import('./silent-disco'),
  'creator-chill': () => import('./creator-chill'),
  'creator-cinema': () => import('./creator-cinema'),
  hula: () => import('./creator-cinema'),
  headliner: () => import('./headliner'),
};

const cache = new Map<VenueRoute, StageMidBundleModule>();

/** Warm the mid-layer bundle for this route (parallel with SFCity import). */
export function preloadStageMidBundle(route: VenueRoute): Promise<void> {
  return loadStageMidBundle(route).then(() => {});
}

export function loadStageMidBundle(route: VenueRoute): Promise<StageMidBundleModule> {
  const hit = cache.get(route);
  if (hit) return Promise.resolve(hit);
  return STAGE_MID_BUNDLE_LOADERS[route]().then(mod => {
    cache.set(route, mod);
    return mod;
  });
}

export function getCachedStageMidBundle(route: VenueRoute): StageMidBundleModule | null {
  return cache.get(route) ?? null;
}
