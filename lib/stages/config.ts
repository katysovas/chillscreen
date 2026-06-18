/** User-created stage knobs — single source of truth. */

export const STAGE_CONFIG = {
  /** Min gap between ambient NPC spawns on entry (ms). */
  NPC_SPAWN_DELAY_MIN_MS: 3_000,
  /** Max gap between ambient NPC spawns on entry (ms). */
  NPC_SPAWN_DELAY_MAX_MS: 5_000,
  /** Ambient NPC count range (inclusive). */
  NPC_SPAWN_COUNT_MIN: 3,
  NPC_SPAWN_COUNT_MAX: 5,
  /** Recent presence → stage stays active. */
  DORMANCY_WINDOW_MS: 30 * 24 * 60 * 60 * 1000,
  /** Past this, slug is released back to the pool. */
  RECLAIM_WINDOW_MS: 90 * 24 * 60 * 60 * 1000,
  /** Max streams in a lineup. */
  MAX_STREAMS: 100,
  /** Slug length bounds. */
  SLUG_MIN_LENGTH: 3,
  SLUG_MAX_LENGTH: 32,
  /** Human-readable stage name — short truss label. */
  DISPLAY_NAME_MAX_LENGTH: 20,
  /** Homepage blurb under the stage name. */
  DESCRIPTION_MAX_LENGTH: 120,
} as const;

export const STAGE_NAME_FIELD_HINT =
  `Min ${STAGE_CONFIG.SLUG_MIN_LENGTH}–${STAGE_CONFIG.SLUG_MAX_LENGTH} characters.`;

export type StageLifecycleTier = 'active' | 'dormant' | 'reclaimable';

export function stageLifecycleTier(
  lastActiveAt: Date | number,
  now = Date.now(),
): StageLifecycleTier {
  const ts = lastActiveAt instanceof Date ? lastActiveAt.getTime() : lastActiveAt;
  const age = now - ts;
  if (age < STAGE_CONFIG.DORMANCY_WINDOW_MS) return 'active';
  if (age < STAGE_CONFIG.RECLAIM_WINDOW_MS) return 'dormant';
  return 'reclaimable';
}
