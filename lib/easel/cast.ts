import type { CharacterDef } from '@/components/game/characters';
import type { StageChannel } from '@/lib/stageVideos';
import { preloadLoadoutItems } from '@/components/game/characters/loadout';
import {
  generatedCharactersForChannel,
  loadGeneratedNpcsForChannel,
} from '@/lib/generatedNpcsClient';
import { EASEL_HAND_BRUSH_ID } from './brushLoadout';
import {
  CINEMA_EASEL_NPC_IDS,
  easelNpcIdsForChannel,
  isEaselPainterForChannel,
} from './npcRotation';

const EASEL_SPAWN = {
  entryDelay: 0,
  startX: 42,
  entryDirection: 'right' as const,
};

/** Ensure easel painters spawn while painting — release to crowd when done. */
export function mergeEaselOwnersIntoCast(
  cast: CharacterDef[],
  channel: StageChannel,
  paintingNpcIds: Set<string>,
): CharacterDef[] {
  if (paintingNpcIds.size === 0) return cast;

  const pool = generatedCharactersForChannel(channel);
  const paintingSet = new Set(paintingNpcIds);
  const rest = cast.filter(c => !paintingSet.has(c.id));

  const owners: CharacterDef[] = [];
  for (const id of paintingNpcIds) {
    const base = cast.find(c => c.id === id) ?? pool.find(c => c.id === id);
    if (!base) continue;
    owners.push({ ...base, ...EASEL_SPAWN });
  }

  return [...owners, ...rest];
}

/** @deprecated use isEaselPainterForChannel */
export function isCinemaEaselPainter(npcId: string): boolean {
  return isEaselPainterForChannel(npcId, 'cinema');
}

/** @deprecated Use isEaselPainterForChannel */
export function isCinemaEaselOwner(npcId: string): boolean {
  return isCinemaEaselPainter(npcId);
}

/** Warm the channel NPC pool so easel painters resolve on first merge. */
export function preloadEaselOwners(channel: StageChannel): Promise<void> {
  return Promise.all([
    loadGeneratedNpcsForChannel(channel),
    preloadLoadoutItems([EASEL_HAND_BRUSH_ID]),
  ]).then(() => {});
}

/** @deprecated use preloadEaselOwners */
export function preloadCinemaEaselOwners(): Promise<void> {
  return preloadEaselOwners('cinema');
}

export { CINEMA_EASEL_NPC_IDS, easelNpcIdsForChannel, isEaselPainterForChannel };
