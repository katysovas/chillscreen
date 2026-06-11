#!/usr/bin/env node
/**
 * One-time import: data/seeds.json → chat_seeds table.
 * Run after db:migrate when the table is empty.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(url);
const raw = JSON.parse(readFileSync(join(root, 'data', 'seeds.json'), 'utf8'));

const rows = [];
for (const line of raw.generated ?? []) {
  const t = String(line).trim();
  if (t) rows.push({ scope: 'general', stage_slug: null, kind: 'generated', line: t });
}
for (const line of raw.fallback ?? []) {
  const t = String(line).trim();
  if (t) rows.push({ scope: 'general', stage_slug: null, kind: 'fallback', line: t });
}
for (const [slug, pool] of Object.entries(raw.stages ?? {})) {
  for (const line of pool.generated ?? []) {
    const t = String(line).trim();
    if (t) rows.push({ scope: 'stage', stage_slug: slug, kind: 'generated', line: t });
  }
  for (const line of pool.fallback ?? []) {
    const t = String(line).trim();
    if (t) rows.push({ scope: 'stage', stage_slug: slug, kind: 'fallback', line: t });
  }
}

const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM chat_seeds`;
if (Number(n) > 0) {
  console.log(`chat_seeds already has ${n} rows — skipping import.`);
  process.exit(0);
}

for (const row of rows) {
  await sql`
    INSERT INTO chat_seeds (scope, stage_slug, kind, line)
    VALUES (${row.scope}, ${row.stage_slug}, ${row.kind}, ${row.line})
  `;
}

console.log(`Imported ${rows.length} seed lines from data/seeds.json`);
