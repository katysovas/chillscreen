/** Ground Score — coins randomly dropped on the sidewalk for players to find. */

import { worldOffForMidTile } from '@/lib/spawn';
import { WORLD_TILE_CYCLE } from '@/lib/worldTiles';

export type GroundCoinValue = 50 | 100;

export type GroundCoin = {
  id: number;
  worldX: number;
  value: GroundCoinValue;
};

/** New coin every ~1 minute. */
export const GROUND_SCORE_SPAWN_MIN_MS = 50_000;
export const GROUND_SCORE_SPAWN_MAX_MS = 70_000;

/** TESTING: drop a coin ~1s after page load. Set false before shipping. */
export const GROUND_SCORE_TEST_DROP_ON_LOAD = false;

/** World-px distance at which the player scoops up the coin. */
export const GROUND_SCORE_PICKUP_DIST_PX = 48;

/** Don't litter the street — uncollected coins cap out. */
export const GROUND_SCORE_MAX_COINS = 8;

export function groundCoinValue(): GroundCoinValue {
  return Math.random() < 0.5 ? 50 : 100;
}

export function groundCoinSpawnDelayMs(): number {
  return (
    GROUND_SCORE_SPAWN_MIN_MS +
    Math.random() * (GROUND_SCORE_SPAWN_MAX_MS - GROUND_SCORE_SPAWN_MIN_MS)
  );
}

/** Spawn offset from the player — off-screen-ish but walkable either direction. */
export function groundCoinSpawnOffsetPx(): number {
  const dist = 350 + Math.random() * 900;
  return Math.random() < 0.5 ? -dist : dist;
}

/**
 * Pick a world X for a new coin.
 * Half the time drops near the player (current area); half the time at a random
 * stage / city across the whole world — giving players a reason to explore.
 */
export function groundCoinWorldX(currentWorldOff: number): number {
  if (Math.random() < 0.5) {
    // Near the player
    return currentWorldOff + groundCoinSpawnOffsetPx();
  }
  // At a random tile across the world (stages, different cities, etc.)
  const tileIndex = Math.floor(Math.random() * WORLD_TILE_CYCLE);
  const fracX = 0.2 + Math.random() * 0.6; // somewhere across that tile
  return worldOffForMidTile(tileIndex, fracX);
}
