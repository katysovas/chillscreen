/** Per-venue NPC roster — generated crowd + that stage's Buz vendor. */

import CHARACTERS, { type CharacterDef } from '@/components/game/characters';
import { finalizeNpcCast } from '@/components/game/characters/loadout';
import { sampledGeneratedCharactersForChannel } from '@/lib/generatedNpcsClient';
import { stageAnchorForRoute, stageChannelForRoute } from '@/lib/isolatedCity';
import type { VenueRoute } from '@/lib/venueSlugs';
import type { StageChannel } from '@/lib/stageVideos';

/** Channels with an explicit empty crowd — skip legacy CHARACTERS fallback. */
const EMPTY_CROWD_CHANNELS = new Set<StageChannel>(['headliner']);

/**
 * NPCs for one isolated city page.
 * When generated NPCs exist for the stage, use a random ambient subset + the local Buz vendor.
 * Festie NPCs are merged separately in SFCity and are never sampled here.
 *
 * Call after `preloadGeneratedNpcsForChannel` for the route's channel.
 */
export function npcCastForVenue(route: VenueRoute, ambientSeed: number): CharacterDef[] {
  const channel = stageChannelForRoute(route);
  const anchor = stageAnchorForRoute(route);
  const vendors = anchor != null
    ? CHARACTERS.filter(c => c.stageAnchor === anchor)
    : [];
  const generated = sampledGeneratedCharactersForChannel(channel, ambientSeed);
  if (generated.length > 0) return finalizeNpcCast([...vendors, ...generated]);
  if (EMPTY_CROWD_CHANNELS.has(channel)) return finalizeNpcCast(vendors);
  return finalizeNpcCast(CHARACTERS);
}

/** Vendor-only cast while the generated NPC chunk is still loading. */
export function vendorCastForVenue(route: VenueRoute): CharacterDef[] {
  const anchor = stageAnchorForRoute(route);
  if (anchor == null) return [];
  return CHARACTERS.filter(c => c.stageAnchor === anchor);
}
