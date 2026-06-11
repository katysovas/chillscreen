/**
 * Server-only roster — includes modelId and personalityNotes.
 * Do not import from client components.
 */
import rosterData from '@/data/npc-roster.json';
import { allGeneratedCharacters, generatedCharactersForChannel } from '@/lib/generatedNpcs';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import { venueSlugFromRoomId } from '@/lib/npcChatter/roomContext';
import { parseVenueSlug, type VenueRoute } from '@/lib/venueSlugs';

export type NpcRosterEntry = {
  id: string;
  displayName: string;
  modelId?: string;
  modelDisplayName?: string;
  personalityNotes: string;
};

const ROSTER: NpcRosterEntry[] = rosterData.npcs;
const byId = new Map(ROSTER.map(n => [n.id, n]));

function routeForRoomId(roomId: string): VenueRoute | null {
  const slug = venueSlugFromRoomId(roomId);
  return slug ? parseVenueSlug(slug) : null;
}

export function getNpcRoster(): NpcRosterEntry[] {
  return ROSTER;
}

export function getNpcRosterEntry(id: string): NpcRosterEntry | undefined {
  const roster = byId.get(id);
  if (roster) return roster;
  for (const ch of allGeneratedCharacters()) {
    if (ch.id === id) {
      return {
        id: ch.id,
        displayName: ch.name,
        personalityNotes: ch.personalityNotes,
      };
    }
  }
  return undefined;
}

export function isChatterNpc(id: string): boolean {
  return getNpcRosterEntry(id) != null;
}

/** Chatter-eligible ids — wandering cast, not stage vendors. */
export function chatterNpcIds(): string[] {
  return ROSTER.map(n => n.id);
}

/** NPCs visible on this venue — generated crowd when present, else hardcoded roster. */
export function chatterNpcIdsForRoom(roomId: string): string[] {
  const route = routeForRoomId(roomId);
  if (!route) return chatterNpcIds();
  const channel = stageChannelForRoute(route);
  const generated = generatedCharactersForChannel(channel);
  if (generated.length >= 2) return generated.map(c => c.id);
  return chatterNpcIds();
}

export function matchNpcMention(text: string, roomId?: string): string | null {
  const lower = text.toLowerCase();
  const eligible = roomId ? new Set(chatterNpcIdsForRoom(roomId)) : null;

  for (const npc of ROSTER) {
    if (eligible && !eligible.has(npc.id)) continue;
    if (lower.includes(`@${npc.id}`) || lower.includes(npc.displayName.toLowerCase())) {
      return npc.id;
    }
  }

  for (const ch of allGeneratedCharacters()) {
    if (eligible && !eligible.has(ch.id)) continue;
    const name = ch.name.toLowerCase();
    if (lower.includes(`@${ch.id}`) || lower.includes(name)) {
      return ch.id;
    }
  }
  return null;
}
