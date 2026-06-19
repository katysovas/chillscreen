import { partyRoomIdForRoute } from '@/lib/isolatedCity';
import { VENUE_SLUGS, type VenueRoute, parseVenueSlug } from '@/lib/venueSlugs';
import { requireDb } from '@/lib/db';
import { chatterAuthHeader } from '@/lib/npcChatter/auth';
import type { AnonymousChatterRow } from './types';

function partyKitHost(): string {
  return (
    process.env.PARTYKIT_HOST?.trim()
    ?? process.env.NEXT_PUBLIC_PARTYKIT_HOST?.trim()
    ?? 'whichstage.katysovas.partykit.dev'
  )
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function partyRoomUrl(roomId: string): string {
  return `https://${partyKitHost()}/parties/main/${roomId}`;
}

async function partyPost<T>(roomId: string, body: Record<string, unknown>): Promise<T> {
  const secret = process.env.NPC_CHATTER_SECRET?.trim();
  if (!secret) throw new Error('NPC_CHATTER_SECRET is not configured');

  const res = await fetch(partyRoomUrl(roomId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...chatterAuthHeader(secret),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${roomId} ${res.status}: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text) as T;
}

export async function listActiveCreatorStageSlugs(): Promise<string[]> {
  const sql = requireDb();
  const rows = await sql`
    SELECT slug FROM user_stages WHERE taken_down_at IS NULL ORDER BY last_active_at DESC
  ` as { slug: string }[];
  return rows.map(r => r.slug);
}

export function builtInRoomIds(): string[] {
  return VENUE_SLUGS.map(slug => {
    const route = parseVenueSlug(slug);
    return route
      ? partyRoomIdForRoute(route as VenueRoute)
      : `whichstage-${slug}`;
  });
}

export async function allModerationRoomIds(): Promise<string[]> {
  const creatorSlugs = await listActiveCreatorStageSlugs().catch(() => []);
  const ids = new Set([
    ...builtInRoomIds(),
    ...creatorSlugs.map(slug => `whichstage-${slug}`),
  ]);
  return [...ids];
}

type PartySenderStat = {
  sender: string;
  user_id?: string | null;
  count: number;
  last_ts: number;
};

export async function aggregateAnonymousChatters(): Promise<AnonymousChatterRow[]> {
  const roomIds = await allModerationRoomIds();
  const merged = new Map<string, AnonymousChatterRow>();

  await Promise.all(roomIds.map(async roomId => {
    try {
      const data = await partyPost<{
        ok?: boolean;
        senders?: PartySenderStat[];
        room?: string;
      }>(roomId, { action: 'list-chatter-senders' });
      for (const stat of data.senders ?? []) {
        if (!stat.sender.startsWith('user:')) continue;
        const displayName = stat.sender.slice(5);
        const key = `${stat.user_id ?? ''}\0${displayName.toLowerCase()}`;
        const slug = roomId.replace(/^whichstage-/, '');
        const hit = merged.get(key);
        if (!hit) {
          merged.set(key, {
            sender: stat.sender,
            display_name: displayName,
            user_id: stat.user_id ?? null,
            message_count: stat.count,
            last_ts: stat.last_ts,
            rooms: [slug],
          });
        } else {
          hit.message_count += stat.count;
          hit.last_ts = Math.max(hit.last_ts, stat.last_ts);
          if (stat.user_id && !hit.user_id) hit.user_id = stat.user_id;
          if (!hit.rooms.includes(slug)) hit.rooms.push(slug);
        }
      }
    } catch {
      /* room may never have been opened */
    }
  }));

  return [...merged.values()].sort((a, b) => b.last_ts - a.last_ts);
}

export async function purgeSenderAcrossRooms(sender: string): Promise<number> {
  const roomIds = await allModerationRoomIds();
  let removed = 0;
  await Promise.all(roomIds.map(async roomId => {
    try {
      const data = await partyPost<{ removed?: number }>(roomId, {
        action: 'purge-chatter',
        sender,
      });
      removed += data.removed ?? 0;
    } catch {
      /* ignore empty rooms */
    }
  }));
  return removed;
}
