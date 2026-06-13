import type { CharacterDef } from '@/components/game/characters';
import type { StageChannel } from '@/lib/stageVideos';
import {
  generatedCharactersForChannel,
  loadGeneratedNpcsForChannel,
} from '@/lib/generatedNpcsClient';

/** Easel owner seeded in DB for chill-cinema — must appear in cast to walk + draw. */
export const CINEMA_EASEL_OWNER_IDS = [
  'gen-cinema-vanessa',
] as const;

const EASEL_SPAWN = {
  entryDelay: 0,
  startX: 42,
  entryDirection: 'right' as const,
};

/** Ensure easel owners spawn on-screen immediately and walk to their canvas. */
export function mergeEaselOwnersIntoCast(
  cast: CharacterDef[],
  channel: StageChannel,
): CharacterDef[] {
  if (channel !== 'cinema') return cast;

  const pool = generatedCharactersForChannel(channel);
  const ownerSet = new Set<string>(CINEMA_EASEL_OWNER_IDS);
  const rest = cast.filter(c => !ownerSet.has(c.id));

  const owners: CharacterDef[] = [];
  for (const id of CINEMA_EASEL_OWNER_IDS) {
    const fromCast = cast.find(c => c.id === id);
    const fromPool = pool.find(c => c.id === id);
    const base = fromCast ?? fromPool;
    if (!base) continue;
    owners.push({ ...base, ...EASEL_SPAWN });
  }

  return [...owners, ...rest];
}

export function isCinemaEaselOwner(npcId: string): boolean {
  return (CINEMA_EASEL_OWNER_IDS as readonly string[]).includes(npcId);
}

/** Warm the cinema NPC pool so easel owners resolve on first merge. */
export function preloadCinemaEaselOwners(): Promise<void> {
  return loadGeneratedNpcsForChannel('cinema').then(() => {});
}
