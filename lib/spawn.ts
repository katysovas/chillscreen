import { midOriginForTile, midWidthForTile } from '@/lib/worldTileGeometry';
import { MID_PARALLAX, VIEW_CENTER_X } from '@/lib/venues';
import { WORLD_TILE_CYCLE, worldTileKind, type WorldTileKind } from '@/lib/worldTiles';

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
