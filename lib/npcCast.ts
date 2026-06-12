/** Per-venue NPC roster — generated crowd + that stage's Buz vendor. */

import CHARACTERS, { type CharacterDef } from '@/components/game/characters';
import { sampledGeneratedCharactersForChannel } from '@/lib/generatedNpcs';
import { stageAnchorForRoute, stageChannelForRoute } from '@/lib/isolatedCity';
import type { VenueRoute } from '@/lib/venueSlugs';

/**
 * NPCs for one isolated city page.
 * When generated NPCs exist for the stage, use a random ambient subset + the local Buz vendor.
 * Festie NPCs are merged separately in SFCity and are never sampled here.
 */
export function npcCastForVenue(route: VenueRoute, ambientSeed: number): CharacterDef[] {
  const channel = stageChannelForRoute(route);
  const anchor = stageAnchorForRoute(route);
  const vendors = anchor != null
    ? CHARACTERS.filter(c => c.stageAnchor === anchor)
    : [];
  const generated = sampledGeneratedCharactersForChannel(channel, ambientSeed);
  if (generated.length > 0) return [...vendors, ...generated];
  return CHARACTERS;
}
