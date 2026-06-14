import { requireDb } from '@/lib/db';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import type { StageChannel } from '@/lib/stageVideos';
import { parseVenueSlug } from '@/lib/venueSlugs';
import { easelStageLookupSlugs, normalizeEaselStage } from './stageKey';
import {
  easelNpcIdForName,
  easelNpcIdsForChannel,
  npcSlug,
} from './stageNpcPool';

export { easelNpcIdForName, easelNpcIdsForChannel, npcSlug };

/** @deprecated use easelNpcIdsForChannel('cinema') */
export const CINEMA_EASEL_NPC_IDS = easelNpcIdsForChannel('cinema');

export function easelNpcIdsForStage(stageSlug: string): string[] {
  const route = parseVenueSlug(stageSlug);
  if (!route) return [];
  return easelNpcIdsForChannel(stageChannelForRoute(route));
}

export function isEaselPainterForStage(npcId: string, stageSlug: string): boolean {
  return easelNpcIdsForStage(stageSlug).includes(npcId);
}

export function isEaselPainterForChannel(npcId: string, channel: StageChannel): boolean {
  return easelNpcIdsForChannel(channel).includes(npcId);
}

async function npcsWhoPaintedOnStage(stage: string): Promise<Set<string>> {
  try {
    const sql = requireDb();
    const slugs = easelStageLookupSlugs(stage);
    const rows = await sql`
      SELECT DISTINCT npc FROM easel WHERE stage = ANY(${slugs})
    ` as { npc: string }[];
    return new Set(rows.map(r => r.npc));
  } catch {
    return new Set();
  }
}

/**
 * Pick the next easel painter — one drawing per NPC before repeating.
 * Prefers NPCs who have never painted on this stage; when all have, rotates
 * round-robin for fresh unique subjects (history gate in generateDrawing).
 */
export async function pickNextEaselNpc(
  stage: string,
  excludeNpc?: string,
): Promise<string> {
  const stageKey = normalizeEaselStage(stage);
  const ids = easelNpcIdsForStage(stageKey);
  if (ids.length === 0) return excludeNpc ?? 'gen-cinema-vanessa';

  const painted = await npcsWhoPaintedOnStage(stageKey);
  const unpainted = ids.filter(id => !painted.has(id));
  const pool = unpainted.length > 0 ? unpainted : ids;

  let lastNpc: string | undefined = excludeNpc;
  try {
    const sql = requireDb();
    const slugs = easelStageLookupSlugs(stageKey);
    const rows = await sql`
      SELECT npc FROM easel
      WHERE stage = ANY(${slugs})
      ORDER BY started_at DESC
      LIMIT 1
    ` as { npc: string }[];
    lastNpc = rows[0]?.npc ?? excludeNpc;
  } catch {
    /* no db */
  }

  const idx = lastNpc ? pool.indexOf(lastNpc) : -1;
  const nextIdx = idx >= 0 ? (idx + 1) % pool.length : 0;
  return pool[nextIdx]!;
}

/** @deprecated use pickNextEaselNpc */
export const pickNextCinemaEaselNpc = pickNextEaselNpc;
