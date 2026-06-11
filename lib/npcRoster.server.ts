/**
 * Server-only chatter roster — re-exports from chatterCast + room routing.
 */
import { formatNpcBrandedName } from '@/lib/npcBrandedName';
import {
  chatterNpcIds,
  chatterNpcIdsForRoute,
  getNpcRosterEntry,
  isChatterNpc,
  type NpcRosterEntry,
} from '@/lib/chatterCast';
import { venueSlugFromRoomId } from '@/lib/npcChatter/roomContext';
import { parseVenueSlug } from '@/lib/venueSlugs';

export type { NpcRosterEntry };
export { getNpcRosterEntry, isChatterNpc, chatterNpcIds };

/** Chatter-eligible ids for this PartyKit room. */
export function chatterNpcIdsForRoom(roomId: string): string[] {
  const slug = venueSlugFromRoomId(roomId);
  const route = slug ? parseVenueSlug(slug) : null;
  if (!route) return chatterNpcIds();
  return chatterNpcIdsForRoute(route);
}

export function matchNpcMention(text: string, roomId?: string): string | null {
  const lower = text.toLowerCase();
  const ids = roomId ? chatterNpcIdsForRoom(roomId) : chatterNpcIds();

  for (const id of ids) {
    const entry = getNpcRosterEntry(id);
    if (!entry) continue;
    const branded = formatNpcBrandedName(entry.displayName, {
      modelId: entry.modelId,
      modelBrand: entry.modelDisplayName,
    }).toLowerCase();
    if (
      lower.includes(`@${id}`) ||
      lower.includes(entry.displayName.toLowerCase()) ||
      lower.includes(branded)
    ) {
      return id;
    }
  }
  return null;
}
