import { hasEnoughRecapEvents, countFestieChatsInEvents, listFestieEventsSince, sumFestieCoinsSince } from '@/lib/festie/events';
import { getFestieById } from '@/lib/festie/db';
import { ensureOfflineFestieActivity } from '@/lib/festie/offlineActivity';
import { filterOwnerCentricRecapEvents, filterRecapEvents, type FestieSessionRecap } from '@/lib/festie/sessionRecap';

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
  const festieName = festie?.name ?? '';
  const displayEvents = festieName
    ? filterOwnerCentricRecapEvents(events, festieName)
    : filterRecapEvents(events);
  if (!hasEnoughRecapEvents(displayEvents)) return null;

  return {
    since,
    until,
    events: displayEvents,
    festieName: festieName || undefined,
    coinsEarned: await sumFestieCoinsSince(festieId, since, until),
    chatCount: countFestieChatsInEvents(displayEvents),
  };
}
