import manifest from '@/data/doodle-manifest.json';
import { npcPoolKey } from '@/lib/easel/drawingsPool';
import type { DoodleManifest, DoodleManifestEntry } from './types';

const file = manifest as DoodleManifest;

export function getDoodleManifest(): DoodleManifest {
  return file;
}

export function manifestEntriesForStage(stageSlug: string): DoodleManifestEntry[] {
  return file.stages[stageSlug]?.easels ?? [];
}

/** True when this stage has any curated doodle manifest entries. */
export function stageUsesDoodleManifest(stageSlug: string): boolean {
  return manifestEntriesForStage(stageSlug).length > 0;
}

export function manifestEntryForNpc(
  stageSlug: string,
  npcId: string,
  excludeIds: string[] = [],
): DoodleManifestEntry | null {
  const key = npcPoolKey(npcId);
  const blocked = new Set(excludeIds);
  const hits = manifestEntriesForStage(stageSlug).filter(
    e => e.npc === key && !blocked.has(e.id),
  );
  if (hits.length === 0) return null;
  let h = 0;
  const seed = `${stageSlug}:${npcId}:${hits.length}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return hits[Math.abs(h) % hits.length] ?? null;
}
