import { gndWidthForTile } from './worldTileGeometry';
import { tileRand, worldTileKind } from './worldTiles';

export type StreetDogPlacement = {
  id: string;
  /** x within the ground tile */
  x: number;
  scale: number;
  flip: boolean;
  ballColor: string;
};

const BALL_COLORS = ['#6E64F0', '#e85d5d', '#4ecb71', '#f5a623', '#50b5d6', '#ff6eb4'];

function makeDog(tile: number, index: number): StreetDogPlacement {
  const w = gndWidthForTile(tile);
  const margin = 90;
  const x = margin + tileRand(tile, `sdg-x-${index}`) * Math.max(0, w - margin * 2);

  return {
    id: `sdg-${tile}-${index}`,
    x,
    scale: 0.22 + tileRand(tile, `sdg-s-${index}`) * 0.08,
    flip: tileRand(tile, `sdg-flip-${index}`) > 0.5,
    ballColor: BALL_COLORS[Math.floor(tileRand(tile, `sdg-ball-${index}`) * BALL_COLORS.length)]!,
  };
}

/** Animated dogs on the sidewalk — denser on city/stage tiles, occasional on towns. */
export function dogsForTile(tile: number): StreetDogPlacement[] {
  const kind = worldTileKind(tile);
  const isCity = kind !== 'town';

  const count = isCity
    ? 1 + Math.floor(tileRand(tile, 'sdg-count') * 2.2)
    : tileRand(tile, 'sdg-town') > 0.58 ? 1 : 0;

  return Array.from({ length: count }, (_, i) => makeDog(tile, i));
}
