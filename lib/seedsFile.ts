/** Server-only read/write for `data/seeds.json`. */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { SEED_STAGE_SLUGS } from '@/lib/seedAdmin';

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

export function readSeedsFile(): SeedsFile {
  try {
    const raw = JSON.parse(readFileSync(SEEDS_JSON_PATH, 'utf8')) as Partial<SeedsFile>;
    return normalizeSeedsFile(raw);
  } catch {
    return normalizeSeedsFile({});
  }
}

export function writeSeedsFile(data: SeedsFile): SeedsFile {
  const normalized = normalizeSeedsFile({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  mkdirSync(dirname(SEEDS_JSON_PATH), { recursive: true });
  writeFileSync(SEEDS_JSON_PATH, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
}
