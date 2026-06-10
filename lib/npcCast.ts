/** Per-venue NPC roster — generated crowd + that stage's Buz vendor. */

import CHARACTERS, { type CharacterDef } from '@/components/game/characters';
import { generatedCharactersForChannel } from '@/lib/generatedNpcs';
import { stageAnchorForRoute, stageChannelForRoute } from '@/lib/isolatedCity';
import type { VenueRoute } from '@/lib/venueSlugs';

/**
 * NPCs for one isolated city page.
 * When generated NPCs exist for the stage, use those + the local Buz vendor only.
 * Otherwise fall back to the legacy hardcoded cast.
 */
export function npcCastForVenue(route: VenueRoute): CharacterDef[] {
  const channel = stageChannelForRoute(route);
  const anchor = stageAnchorForRoute(route);
  const vendors = anchor != null
    ? CHARACTERS.filter(c => c.stageAnchor === anchor)
    : [];
  const generated = generatedCharactersForChannel(channel);
  if (generated.length > 0) return [...vendors, ...generated];
  return CHARACTERS;
}
