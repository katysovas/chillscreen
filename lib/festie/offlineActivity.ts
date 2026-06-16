import { FESTIE_CONFIG } from '@/lib/festie/config';
import {
  countSynthesizedLifeLogsSince,
  FESTIE_EVENT_TYPES,
  hasLifeLogKindSince,
  insertFestieEventsBatch,
  type FestieEventInsert,
} from '@/lib/festie/events';
import {
  buildLifeLogContextShared,
  generateLifeLogWithContext,
  lifeLogSeed,
  pickLifeLogGenerators,
  randomLogTimestamp,
  targetLifeLogCount,
} from '@/lib/festie/lifeLogs';
import type { FestieRow } from '@/lib/festie/types';

/**
 * Backfill festival life logs while the owner was away.
 * Runs before recap fetch — random timestamps, varied log types.
 * NPC pair chats are generated on a cron while offline (see offlineChatterCron).
 */
export async function ensureOfflineFestieActivity(
  festie: FestieRow,
  until: string = new Date().toISOString(),
): Promise<void> {
  const since = festie.last_seen_at;
  const sinceMs = new Date(since).getTime();
  const untilMs = new Date(until).getTime();
  if (untilMs - sinceMs < 45 * 60 * 1000) return;

  const liveEndMs = sinceMs + FESTIE_CONFIG.LIVE_WINDOW_MS;
  const effectiveUntilMs = Math.min(untilMs, liveEndMs);
  if (effectiveUntilMs <= sinceMs) return;

  const existing = await countSynthesizedLifeLogsSince(festie.id, since);
  const seedRng = () => {
    const n = lifeLogSeed(festie.id, since, -1);
    return ((n >>> 0) % 1000) / 1000;
  };
  const target = targetLifeLogCount(sinceMs, effectiveUntilMs, seedRng);
  const toCreate = target - existing;
  if (toCreate <= 0) return;

  const sinceDate = new Date(since);
  const untilDate = new Date(effectiveUntilMs);
  const generators = pickLifeLogGenerators(toCreate, festie.id, since, existing);
  const lostItemAllowed = !(await hasLifeLogKindSince(festie.id, since, 'lost_item'));
  let lostItemLogged = !lostItemAllowed;

  const shared = await buildLifeLogContextShared(festie, sinceDate, untilDate);
  const pending: FestieEventInsert[] = [];

  for (let i = 0; i < generators.length; i++) {
    const slot = existing + i;
    const tsRng = () => ((lifeLogSeed(festie.id, since, slot + 500) >>> 0) % 10000) / 10000;
    const atMs = randomLogTimestamp(sinceMs, effectiveUntilMs, i, generators.length, tsRng);
    const at = new Date(atMs);
    const result = generateLifeLogWithContext(shared, generators[i]!, at, slot);
    if (!result) continue;
    if (result.kind === 'lost_item') {
      if (lostItemLogged) continue;
      lostItemLogged = true;
    }

    pending.push({
      festieId: festie.id,
      type: FESTIE_EVENT_TYPES.LIFE_LOG,
      payload: {
        kind: result.kind,
        text: result.text,
        synthesized: true,
      },
      createdAt: at.toISOString(),
    });
  }

  if (pending.length) {
    await insertFestieEventsBatch(pending);
  }
}
