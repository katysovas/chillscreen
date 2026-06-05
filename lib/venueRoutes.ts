import { cityTileIndex } from '@/lib/spawn';
import { cinemaMidX, coachellaMidX, concertMidX, MID_PARALLAX, VIEW_CENTER_X } from '@/lib/venues';
import { midOriginForTile } from '@/lib/worldTileGeometry';

/** Deep-linkable venue destinations. */
export type VenueRoute =
  | 'coachella'
  | 'outside-hands'
  | 'seattle-concerts'
  | 'cinema';

/** Canonical URL slugs (case preserved for pretty links). */
export const VENUE_SLUGS = [
  'Coachella',
  'Outside-Hands',
  'Seattle-Concerts',
  'Cinema',
] as const;

const SLUG_TO_ROUTE: Record<string, VenueRoute> = {
  coachella: 'coachella',
  'outside-hands': 'outside-hands',
  'seattle-concerts': 'seattle-concerts',
  cinema: 'cinema',
  'chill-cinema': 'cinema',
};

/** Parse a URL segment like `Coachella` or `outside-hands`. */
export function parseVenueSlug(slug: string): VenueRoute | null {
  return SLUG_TO_ROUTE[slug.toLowerCase().replace(/_/g, '-')] ?? null;
}

/** Ground scroll offset that centers a mid-layer anchor in the viewport. */
function worldOffCenteringMidX(tile: number, midX: number): number {
  const worldX = midOriginForTile(tile) + midX;
  const vx = worldX - VIEW_CENTER_X;
  return vx / MID_PARALLAX;
}

/** World offset that places the player in front of the given venue. */
export function worldOffForVenueRoute(route: VenueRoute): number {
  switch (route) {
    case 'coachella': {
      const tile = cityTileIndex('coachella');
      const midX = coachellaMidX(tile);
      if (midX == null) throw new Error('coachella midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
    case 'outside-hands': {
      const tile = cityTileIndex('sf');
      const midX = concertMidX(tile);
      if (midX == null) throw new Error('outside-hands midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
    case 'seattle-concerts': {
      const tile = cityTileIndex('seattle');
      const midX = concertMidX(tile);
      if (midX == null) throw new Error('seattle-concerts midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
    case 'cinema': {
      const tile = cityTileIndex('sf');
      const midX = cinemaMidX(tile);
      if (midX == null) throw new Error('cinema midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
  }
}
