/**
 * Server-only chatter roster — hardcoded NPCs + synced offline festies.
 */
import { formatNpcBrandedName } from '@/lib/npcBrandedName';
import {
  chatterNpcIds,
  chatterNpcIdsForChannel,
  chatterNpcIdsForRoute,
  getNpcRosterEntry as getStaticNpcRosterEntry,
  isChatterNpc as isStaticChatterNpc,
  type NpcRosterEntry,
} from '@/lib/chatterCast';
import { festieToRosterEntry } from '@/lib/festie/chatterRoster';
import { getFestieById, toFestiePublic } from '@/lib/festie/db';
import { festieIdFromNpcId, isFestieNpcId } from '@/lib/festie/toCharacterDef';
import type { FestiePublic } from '@/lib/festie/types';
import { venueSlugFromRoomId } from '@/lib/npcChatter/roomContext';
import { parseVenueSlug } from '@/lib/venueSlugs';

export type { NpcRosterEntry };
export { chatterNpcIds };

/** Offline festies on stage — updated by PartyKit festies sync (any life tier on stage). */
let festieChatterRoster = new Map<string, NpcRosterEntry>();

export function setFestieChatterRoster(festies: FestiePublic[]): void {
  const entries = festies.map(f => festieToRosterEntry(f));
  festieChatterRoster = new Map(entries.map(e => [e.id, e]));
}

export function festieChatterNpcIds(): string[] {
  return [...festieChatterRoster.keys()];
}

export function getNpcRosterEntry(id: string): NpcRosterEntry | undefined {
  return festieChatterRoster.get(id) ?? getStaticNpcRosterEntry(id);
}

/** DB fallback for API routes when festie roster cache is empty. */
export async function resolveNpcRosterEntry(id: string): Promise<NpcRosterEntry | undefined> {
  const cached = getNpcRosterEntry(id);
  if (cached) return cached;

  if (!isFestieNpcId(id)) return undefined;
  const festieId = festieIdFromNpcId(id);
  if (!festieId) return undefined;

  const row = await getFestieById(festieId);
  if (!row) return undefined;
  return festieToRosterEntry(toFestiePublic(row));
}

export function isChatterNpc(id: string): boolean {
  return festieChatterRoster.has(id) || isStaticChatterNpc(id);
}

export async function isChatterNpcAllowed(id: string): Promise<boolean> {
  if (isChatterNpc(id)) return true;
  return Boolean(await resolveNpcRosterEntry(id));
}

/** Chatter-eligible ids for this PartyKit room (static cast + synced festies). */
export function chatterNpcIdsForRoom(roomId: string): string[] {
  const slug = venueSlugFromRoomId(roomId);
  const route = slug ? parseVenueSlug(slug) : null;
  const staticIds = route
    ? chatterNpcIdsForRoute(route)
    : chatterNpcIdsForChannel('which-stage');
  const festieIds = festieChatterNpcIds();
  if (festieIds.length === 0) return staticIds;
  return [...new Set([...staticIds, ...festieIds])];
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
