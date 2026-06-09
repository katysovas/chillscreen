import { midOriginForTile, midWidthForTile } from '@/lib/worldTileGeometry';
import { MID_PARALLAX, START_WORLD_OFF, VIEW_CENTER_X } from '@/lib/venues';
import { WORLD_TILE_CYCLE, worldTileKind, type WorldTileKind } from '@/lib/worldTiles';

const CITY_KINDS: WorldTileKind[] = ['sf', 'vegas', 'san_diego', 'coachella', 'tentaroo', 'forest', 'seattle'];

/** Ground scroll offset that centers a mid-layer tile at the given horizontal fraction (0–1). */
export function worldOffForMidTile(tileIndex: number, fracX = 0.5): number {
  const midX = midOriginForTile(tileIndex) + midWidthForTile(tileIndex) * fracX;
  const vx = midX - VIEW_CENTER_X;
  return vx / MID_PARALLAX;
}

/** First-cycle mid tile index for a city kind. */
export function cityTileIndex(kind: WorldTileKind): number {
  for (let t = 0; t < WORLD_TILE_CYCLE; t++) {
    if (worldTileKind(t) === kind) return t;
    if ((kind === 'coachella' || kind === 'san_diego') && worldTileKind(t) === 'san_diego') return t;
  }
  return 0;
}

/** Deterministic spawn for SSR / hydration (matches pre-random default). */
export function serverSpawnWorldOff(): number {
  return START_WORLD_OFF;
}

/** Pick a random city and return worldOff placing the player in its downtown. Client-only. */
export function randomCitySpawnWorldOff(): number {
  const kind = CITY_KINDS[Math.floor(Math.random() * CITY_KINDS.length)]!;
  const tile = cityTileIndex(kind);
  const frac = 0.38 + Math.random() * 0.24;
  return worldOffForMidTile(tile, frac);
}

let cachedClientSpawn: number | undefined;

/** Stable random spawn after hydration — cached for the session. */
export function getClientSpawnWorldOff(): number {
  if (cachedClientSpawn === undefined) {
    cachedClientSpawn = randomCitySpawnWorldOff();
  }
  return cachedClientSpawn;
}

export function subscribeSpawnWorldOff() {
  return () => {};
}
