import type { GeneratedNpc } from '@/lib/npcGenerator';
import type { StageChannel } from '@/lib/stageVideos';
import bumbershootNpcs from '@/data/generated-npcs/channels/bumbershoot.json';
import cinemaNpcs from '@/data/generated-npcs/channels/cinema.json';
import coachellaNpcs from '@/data/generated-npcs/channels/coachella.json';
import deepSpaceNpcs from '@/data/generated-npcs/channels/deep-space.json';
import edcNpcs from '@/data/generated-npcs/channels/edc.json';
import forestNpcs from '@/data/generated-npcs/channels/forest.json';
import outsideLandsNpcs from '@/data/generated-npcs/channels/outside-lands.json';
import silentDiscoNpcs from '@/data/generated-npcs/channels/silent-disco.json';
import whichStageNpcs from '@/data/generated-npcs/channels/which-stage.json';

/** Server-safe generated NPC pools keyed by playlist channel. */
export const CHANNEL_NPC_POOL: Record<StageChannel, GeneratedNpc[]> = {
  cinema: cinemaNpcs as GeneratedNpc[],
  'deep-space': deepSpaceNpcs as GeneratedNpc[],
  bumbershoot: bumbershootNpcs as GeneratedNpc[],
  'outside-lands': outsideLandsNpcs as GeneratedNpc[],
  coachella: coachellaNpcs as GeneratedNpc[],
  edc: edcNpcs as GeneratedNpc[],
  'which-stage': whichStageNpcs as GeneratedNpc[],
  forest: forestNpcs as GeneratedNpc[],
  'silent-disco': silentDiscoNpcs as GeneratedNpc[],
  hula: whichStageNpcs as GeneratedNpc[],
  headliner: [],
};

export function npcSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function easelNpcIdForName(channel: StageChannel, name: string): string {
  return `gen-${channel}-${npcSlug(name)}`;
}

export function easelNpcIdsForChannel(channel: StageChannel): string[] {
  return (CHANNEL_NPC_POOL[channel] ?? []).map(n => easelNpcIdForName(channel, n.name));
}

export function vibeForChannelNpc(channel: StageChannel, npcId: string): string | null {
  const name = npcId.split('-').pop()?.toLowerCase();
  if (!name) return null;
  const hit = (CHANNEL_NPC_POOL[channel] ?? []).find(n => npcSlug(n.name) === name);
  return hit?.vibe?.trim() ?? null;
}
