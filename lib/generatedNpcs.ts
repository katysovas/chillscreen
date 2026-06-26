/**
 * Generated ambient NPCs — server/admin uses the monolithic JSON;
 * the browser loads per-channel chunks via `generatedNpcsClient.ts`.
 */

import generatedNpcsFile from '@/data/generated-npcs.json';
import type { CharacterDef } from '@/components/game/characters';
import type { StageChannel } from '@/lib/stageVideos';
import { dedupeGeneratedNpcs, type GeneratedNpc } from '@/lib/npcGenerator';
import {
  characterDefsFromFullPool,
  characterDefsFromPool,
  sampleGeneratedNpcs,
} from './generatedNpcsCore';
import { resolveGeneratedNpcPool } from './generatedNpcPool';

export { sampleGeneratedNpcs } from './generatedNpcsCore';

const FILE = generatedNpcsFile as {
  version: number;
  channels: Partial<Record<StageChannel, GeneratedNpc[]>>;
};

/** Full generated pool for one channel (chat lookup, admin). */
export function generatedCharactersForChannel(channel: StageChannel): CharacterDef[] {
  return characterDefsFromFullPool(resolveGeneratedNpcPool(FILE.channels, channel), channel);
}

/** Random ambient subset for one stage visit — server-side fallback. */
export function sampledGeneratedCharactersForChannel(
  channel: StageChannel,
  seed: number,
): CharacterDef[] {
  return characterDefsFromPool(resolveGeneratedNpcPool(FILE.channels, channel), channel, seed);
}

/** All generated NPCs across every stage (chat API lookup). */
export function allGeneratedCharacters(): CharacterDef[] {
  return (Object.keys(FILE.channels) as StageChannel[]).flatMap(ch => {
    const npcs = dedupeGeneratedNpcs(FILE.channels[ch] ?? []);
    return characterDefsFromFullPool(npcs, ch);
  });
}
