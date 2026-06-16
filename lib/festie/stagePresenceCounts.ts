import { partyRoomIdForRoute } from '@/lib/isolatedCity';
import { partyRoomIdForStageSlug } from '@/lib/stages/runtime';
import { countActiveFestiesByStage } from '@/lib/festie/db';
import { listFeaturedUserStages } from '@/lib/stages/db';
import { getDb } from '@/lib/db';
import { parseVenueSlug, VENUE_SLUGS, type VenueRoute } from '@/lib/venueSlugs';

function partyKitServerHost(): string {
  return (
    process.env.PARTYKIT_HOST?.trim()
    ?? process.env.NEXT_PUBLIC_PARTYKIT_HOST?.trim()
    ?? '127.0.0.1:1999'
  )
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function partyKitProtocol(host: string): 'http' | 'https' {
  return host.startsWith('127.0.0.1') || host.startsWith('localhost') ? 'http' : 'https';
}

/** Live player count per stage room from PartyKit HTTP stats. */
export async function fetchPartyRoomPresence(
  extraSlugs: string[] = [],
): Promise<Record<string, number>> {
  const host = partyKitServerHost();
  const protocol = partyKitProtocol(host);
  const party = 'whichstage';
  const slugSet = new Set([...VENUE_SLUGS, ...extraSlugs.map(s => s.trim().toLowerCase()).filter(Boolean)]);

  const entries = await Promise.all(
    [...slugSet].map(async slug => {
      const route = parseVenueSlug(slug);
      const roomId = route
        ? partyRoomIdForRoute(route as VenueRoute)
        : partyRoomIdForStageSlug(slug);
      try {
        const res = await fetch(`${protocol}://${host}/parties/${party}/${roomId}`, {
          signal: AbortSignal.timeout(2_500),
          next: { revalidate: 0 },
        });
        if (!res.ok) return [slug, 0] as const;
        const data = await res.json() as { players?: number };
        return [slug, Math.max(0, Number(data.players ?? 0))] as const;
      } catch {
        return [slug, 0] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

/** Live player count for a single creator or venue slug. */
export async function fetchPartyRoomPlayerCount(slug: string): Promise<number> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return 0;
  const counts = await fetchPartyRoomPresence([normalized]);
  return counts[normalized] ?? 0;
}

/** Real festies only (DB active + live room players). */
export async function resolveRealFestieCounts(): Promise<Record<string, number>> {
  const activeCounts = getDb()
    ? await countActiveFestiesByStage().catch(() => ({} as Record<string, number>))
    : {} as Record<string, number>;

  const featuredSlugs = getDb()
    ? (await listFeaturedUserStages().catch(() => [])).map(s => s.slug)
    : [];

  const creatorSlugsFromDb = Object.keys(activeCounts).filter(
    slug => !VENUE_SLUGS.includes(slug as typeof VENUE_SLUGS[number]),
  );
  const extraSlugs = [...new Set([...featuredSlugs, ...creatorSlugsFromDb])];

  const partyCounts = await fetchPartyRoomPresence(extraSlugs).catch(
    () => ({} as Record<string, number>),
  );

  const out: Record<string, number> = {};
  for (const slug of VENUE_SLUGS) {
    out[slug] = Math.max(activeCounts[slug] ?? 0, partyCounts[slug] ?? 0);
  }
  for (const slug of extraSlugs) {
    out[slug] = Math.max(activeCounts[slug] ?? 0, partyCounts[slug] ?? 0);
  }
  for (const [slug, count] of Object.entries(activeCounts)) {
    if (out[slug] == null) {
      out[slug] = Math.max(0, count);
    }
  }
  return out;
}
