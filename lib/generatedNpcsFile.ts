/** Server-only fs helpers for `data/generated-npcs.json` (admin save target). */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import type { StageChannel } from './stageVideos';
import { dedupeGeneratedNpcs, type GeneratedNpc } from './npcGenerator';

export type GeneratedNpcsFile = {
  version: 1;
  updatedAt: string;
  channels: Partial<Record<StageChannel, GeneratedNpc[]>>;
};

export const GENERATED_NPCS_JSON_PATH = join(process.cwd(), 'data', 'generated-npcs.json');

export function readGeneratedNpcsFile(): GeneratedNpcsFile {
  try {
    const raw = readFileSync(GENERATED_NPCS_JSON_PATH, 'utf8');
    return JSON.parse(raw) as GeneratedNpcsFile;
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), channels: {} };
  }
}

export function writeGeneratedNpcsFile(data: GeneratedNpcsFile): void {
  mkdirSync(dirname(GENERATED_NPCS_JSON_PATH), { recursive: true });
  writeFileSync(GENERATED_NPCS_JSON_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/** Replace one channel's NPC list and persist. */
export function updateChannelNpcs(
  channel: StageChannel,
  npcs: GeneratedNpc[],
): GeneratedNpcsFile {
  const file = readGeneratedNpcsFile();
  file.channels[channel] = dedupeGeneratedNpcs(npcs);
  file.updatedAt = new Date().toISOString();
  writeGeneratedNpcsFile(file);
  return file;
}
