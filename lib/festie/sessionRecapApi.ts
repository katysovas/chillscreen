import {
  countFestieChatsInEvents,
  hasRecapContent,
  listFestieEventsSince,
  sumFestieCoinsSince,
} from '@/lib/festie/events';
import { filterRecapEvents, type FestieSessionRecap } from '@/lib/festie/sessionRecap';

/** Build recap for the offline window [since, until) — last session only. */
export async function buildFestieSessionRecap(
  festieId: string,
  since: string,
  until: string,
): Promise<FestieSessionRecap | null> {
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
