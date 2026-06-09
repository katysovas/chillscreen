/** Ground Score — coins randomly dropped on the sidewalk for players to find. */

export type GroundCoinValue = 50 | 100;

export type GroundCoin = {
  id: number;
  worldX: number;
  value: GroundCoinValue;
};

/** New coin every 3–10 minutes. */
export const GROUND_SCORE_SPAWN_MIN_MS = 3 * 60_000;
export const GROUND_SCORE_SPAWN_MAX_MS = 10 * 60_000;

/** TESTING: drop a coin ~1s after page load. Set false before shipping. */
export const GROUND_SCORE_TEST_DROP_ON_LOAD = false;

/** World-px distance at which the player scoops up the coin. */
export const GROUND_SCORE_PICKUP_DIST_PX = 48;

/** Don't litter the street — uncollected coins cap out. */
export const GROUND_SCORE_MAX_COINS = 4;

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
