import { preloadStageMidBundle } from '@/components/game/city/stageBundles/registry';
import {
  CHILL_FOREST_LAYERS,
  CREATOR_SCENE_HREF,
} from '@/components/game/city/chill/constants';
import type { VenueRoute } from '@/lib/venueRoutes';

export const LANDING_HERO_VENUE = 'creator-chill' as const satisfies VenueRoute;

function preloadImage(url: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

let assetsPromise: Promise<void> | null = null;
let sfCityPromise: Promise<typeof import('@/components/game/SFCity')> | null = null;

/** Forest + stage bundle only — skip playlists, NPCs, and player loadout on `/`. */
export function preloadLandingHeroAssets(): Promise<void> {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      preloadStageMidBundle(LANDING_HERO_VENUE),
      preloadImage(CREATOR_SCENE_HREF),
      ...CHILL_FOREST_LAYERS.map(preloadImage),
    ]).then(() => {});
  }
  return assetsPromise;
}

/** Warm the SFCity chunk as soon as the landing page mounts. */
export function warmLandingHeroSFCity(): Promise<typeof import('@/components/game/SFCity')> {
  if (!sfCityPromise) {
    sfCityPromise = import('@/components/game/SFCity');
  }
  return sfCityPromise;
}
