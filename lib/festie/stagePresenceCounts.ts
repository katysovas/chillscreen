import { partyRoomIdForRoute } from '@/lib/isolatedCity';
import { countActiveFestiesByStage } from '@/lib/festie/db';
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
export async function fetchPartyRoomPresence(): Promise<Record<string, number>> {
  const host = partyKitServerHost();
  const protocol = partyKitProtocol(host);
  const party = 'whichstage';

  const entries = await Promise.all(
    VENUE_SLUGS.map(async slug => {
      const route = parseVenueSlug(slug);
      if (!route) return [slug, 0] as const;
      const roomId = partyRoomIdForRoute(route as VenueRoute);
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

/** Real festies only (DB active + live room players). */
export async function resolveRealFestieCounts(): Promise<Record<string, number>> {
  const [activeCounts, partyCounts] = await Promise.all([
    getDb()
      ? countActiveFestiesByStage().catch(() => ({} as Record<string, number>))
      : Promise.resolve({} as Record<string, number>),
    fetchPartyRoomPresence().catch(() => ({} as Record<string, number>)),
  ]);

  const out: Record<string, number> = {};
  for (const slug of VENUE_SLUGS) {
    out[slug] = Math.max(activeCounts[slug] ?? 0, partyCounts[slug] ?? 0);
  }
  return out;
}
