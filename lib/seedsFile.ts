/** Server-only read/write for conversation seeds (Neon `chat_seeds` table). */

import { readFileSync } from 'fs';
import { join } from 'path';
import { SEED_STAGE_SLUGS } from '@/lib/seedAdmin';
import {
  countChatSeeds,
  readSeedsFromDb,
  writeSeedsToDb,
} from '@/lib/seeds/db';

export type SeedPool = {
  generated?: string[];
  fallback?: string[];
};

export type SeedsFile = {
  version: 1;
  updatedAt: string;
  generated: string[];
  fallback: string[];
  stages: Record<string, SeedPool>;
};

export const SEEDS_JSON_PATH = join(process.cwd(), 'data', 'seeds.json');

function emptyStagePools(): Record<string, SeedPool> {
  return Object.fromEntries(SEED_STAGE_SLUGS.map(slug => [slug, { generated: [], fallback: [] }]));
}

export function normalizeSeedsFile(raw: Partial<SeedsFile>): SeedsFile {
  const stages = { ...emptyStagePools(), ...(raw.stages ?? {}) };
  for (const slug of SEED_STAGE_SLUGS) {
    stages[slug] = {
      generated: [...(stages[slug]?.generated ?? [])],
      fallback: [...(stages[slug]?.fallback ?? [])],
    };
  }
  return {
    version: 1,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    generated: [...(raw.generated ?? [])],
    fallback: [...(raw.fallback ?? [])],
    stages,
  };
}

function readSeedsFileFromDisk(): SeedsFile {
  try {
    const raw = JSON.parse(readFileSync(SEEDS_JSON_PATH, 'utf8')) as Partial<SeedsFile>;
    return normalizeSeedsFile(raw);
  } catch {
    return normalizeSeedsFile({});
  }
}

/** Load seeds from DB; auto-import from data/seeds.json when table is empty. */
export async function readSeedsFile(): Promise<SeedsFile> {
  try {
    const count = await countChatSeeds();
    if (count === 0) {
      const disk = readSeedsFileFromDisk();
      if (disk.generated.length + disk.fallback.length > 0
        || Object.values(disk.stages).some(s => (s.generated?.length ?? 0) + (s.fallback?.length ?? 0) > 0)) {
        return writeSeedsToDb(normalizeSeedsFile(disk));
      }
    }
    return readSeedsFromDb();
  } catch (err) {
    console.error('[seedsFile] DB read failed, falling back to disk', err);
    return readSeedsFileFromDisk();
  }
}

export async function writeSeedsFile(data: SeedsFile): Promise<SeedsFile> {
  const normalized = normalizeSeedsFile({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  try {
    return await writeSeedsToDb(normalized);
  } catch (err) {
    console.error('[seedsFile] DB write failed', err);
    throw err;
  }
}
