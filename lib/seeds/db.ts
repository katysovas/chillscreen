import { requireDb } from '@/lib/db';
import { getBundledSeedPools } from '@/lib/seeds/bundled';
import type { SeedsFile } from '@/lib/seedsFile';

export type ChatSeedScope = 'general' | 'stage';
export type ChatSeedKind = 'generated' | 'fallback';

export type SeedPools = {
  generated: string[];
  fallback: string[];
};

export async function countChatSeeds(): Promise<number> {
  const sql = requireDb();
  const rows = await sql`SELECT COUNT(*)::int AS n FROM chat_seeds`;
  return Number((rows[0] as { n: number }).n);
}

/** Global + stage-specific lines merged (same logic as former seeds.json). */
export async function getMergedSeedPool(
  stageSlug: string | null | undefined,
  kind: ChatSeedKind,
): Promise<string[]> {
  try {
    const sql = requireDb();
    const globalRows = await sql`
      SELECT line FROM chat_seeds
      WHERE scope = 'general' AND kind = ${kind}
      ORDER BY id
    `;
    const global = globalRows.map(r => String((r as { line: string }).line));
    if (!stageSlug?.trim()) {
      if (global.length > 0) return global;
      const bundled = getBundledSeedPools(null);
      return kind === 'generated' ? bundled.generated : bundled.fallback;
    }

    const stageRows = await sql`
      SELECT line FROM chat_seeds
      WHERE scope = 'stage' AND stage_slug = ${stageSlug.trim()} AND kind = ${kind}
      ORDER BY id
    `;
    const stage = stageRows.map(r => String((r as { line: string }).line));
    const merged = [...global, ...stage];
    if (merged.length > 0) return merged;
  } catch (err) {
    console.error('[seeds/db] getMergedSeedPool failed, using bundled', err);
  }

  const bundled = getBundledSeedPools(stageSlug);
  return kind === 'generated' ? bundled.generated : bundled.fallback;
}

export async function getMergedSeedPools(
  stageSlug: string | null | undefined,
): Promise<SeedPools> {
  const [generated, fallback] = await Promise.all([
    getMergedSeedPool(stageSlug, 'generated'),
    getMergedSeedPool(stageSlug, 'fallback'),
  ]);
  return { generated, fallback };
}

/** Rebuild admin SeedsFile shape from DB rows. */
export async function readSeedsFromDb(): Promise<SeedsFile> {
  const sql = requireDb();
  const rows = await sql`
    SELECT scope, stage_slug, kind, line
    FROM chat_seeds
    ORDER BY id
  `;

  const generated: string[] = [];
  const fallback: string[] = [];
  const stages: SeedsFile['stages'] = {};

  for (const row of rows) {
    const r = row as {
      scope: ChatSeedScope;
      stage_slug: string | null;
      kind: ChatSeedKind;
      line: string;
    };
    const line = String(r.line).trim();
    if (!line) continue;

    if (r.scope === 'general') {
      if (r.kind === 'generated') generated.push(line);
      else fallback.push(line);
      continue;
    }

    const slug = r.stage_slug?.trim();
    if (!slug) continue;
    if (!stages[slug]) stages[slug] = { generated: [], fallback: [] };
    if (r.kind === 'generated') stages[slug].generated!.push(line);
    else stages[slug].fallback!.push(line);
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    generated,
    fallback,
    stages,
  };
}

/** Replace all seed rows from the admin file shape. */
export async function writeSeedsToDb(data: SeedsFile): Promise<SeedsFile> {
  const sql = requireDb();
  await sql`DELETE FROM chat_seeds`;

  const inserts: {
    scope: ChatSeedScope;
    stage_slug: string | null;
    kind: ChatSeedKind;
    line: string;
  }[] = [];

  for (const line of data.generated) {
    const trimmed = line.trim();
    if (trimmed) inserts.push({ scope: 'general', stage_slug: null, kind: 'generated', line: trimmed });
  }
  for (const line of data.fallback) {
    const trimmed = line.trim();
    if (trimmed) inserts.push({ scope: 'general', stage_slug: null, kind: 'fallback', line: trimmed });
  }
  for (const [slug, pool] of Object.entries(data.stages ?? {})) {
    for (const line of pool.generated ?? []) {
      const trimmed = line.trim();
      if (trimmed) {
        inserts.push({ scope: 'stage', stage_slug: slug, kind: 'generated', line: trimmed });
      }
    }
    for (const line of pool.fallback ?? []) {
      const trimmed = line.trim();
      if (trimmed) {
        inserts.push({ scope: 'stage', stage_slug: slug, kind: 'fallback', line: trimmed });
      }
    }
  }

  const BATCH = 100;
  for (let i = 0; i < inserts.length; i += BATCH) {
    const batch = inserts.slice(i, i + BATCH);
    const scopes = batch.map(r => r.scope);
    const stageSlugs = batch.map(r => r.stage_slug);
    const kinds = batch.map(r => r.kind);
    const lines = batch.map(r => r.line);
    await sql`
      INSERT INTO chat_seeds (scope, stage_slug, kind, line)
      SELECT *
      FROM UNNEST(
        ${scopes}::text[],
        ${stageSlugs}::text[],
        ${kinds}::text[],
        ${lines}::text[]
      ) AS t(scope, stage_slug, kind, line)
    `;
  }

  return readSeedsFromDb();
}
