import {
  countFestieChatsInEvents,
  hasRecapContent,
  listFestieEventsSince,
  sumFestieCoinsSince,
} from '@/lib/festie/events';
import { getFestieById } from '@/lib/festie/db';
import { ensureOfflineFestieActivity } from '@/lib/festie/offlineActivity';
import { filterRecapEvents, type FestieSessionRecap } from '@/lib/festie/sessionRecap';

/** Build recap for the offline window [since, until) — last session only. */
export async function buildFestieSessionRecap(
  festieId: string,
  since: string,
  until: string,
): Promise<FestieSessionRecap | null> {
  const festie = await getFestieById(festieId);
  if (festie) {
    await ensureOfflineFestieActivity(festie, until);
  }

  const events = await listFestieEventsSince(festieId, since, { until });
  const displayEvents = filterRecapEvents(events);
  if (!hasRecapContent(displayEvents)) return null;

  return {
    since,
    until,
    events: displayEvents,
    coinsEarned: await sumFestieCoinsSince(festieId, since, until),
    chatCount: countFestieChatsInEvents(displayEvents),
  };
}
