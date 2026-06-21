#!/usr/bin/env node
/**
 * Apply pending SQL files from migrations/ to Neon.
 * Tracks applied files in schema_migrations so re-runs are safe.
 * Requires DATABASE_URL in .env.local or environment.
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error('DATABASE_URL is not set. Add it to .env.local first.');
  process.exit(1);
}

const sql = neon(url);

const migrationFiles = readdirSync(join(root, 'migrations'))
  .filter(f => f.endsWith('.sql'))
  .sort();

function splitStatements(migration) {
  const withoutComments = migration
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  return withoutComments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function ensureMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

async function appliedFilenames() {
  const rows = await sql`SELECT filename FROM schema_migrations ORDER BY filename`;
  return new Set(rows.map(row => String(row.filename)));
}

/** Best-effort detection for DBs created before schema_migrations existed. */
async function inferAlreadyApplied(filename) {
  if (filename <= '023_moderation_blocks.sql') {
    const rows = await sql`SELECT to_regclass('public.users') AS reg`;
    return Boolean(rows[0]?.reg);
  }
  if (filename === '024_lineup_votes.sql') {
    const rows = await sql`SELECT to_regclass('public.lineup_votes') AS reg`;
    return Boolean(rows[0]?.reg);
  }
  if (filename === '025_user_stage_social_links.sql') {
    const rows = await sql`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_stages'
        AND column_name = 'social_links'
      LIMIT 1
    `;
    return rows.length > 0;
  }
  return false;
}

async function recordMigration(filename) {
  await sql`
    INSERT INTO schema_migrations (filename)
    VALUES (${filename})
    ON CONFLICT (filename) DO NOTHING
  `;
}

async function bootstrapExistingDatabase(applied) {
  if (applied.size > 0) return;

  const rows = await sql`SELECT to_regclass('public.users') AS reg`;
  if (!rows[0]?.reg) return;

  console.log('\nExisting database detected — bootstrapping schema_migrations…');
  for (const file of migrationFiles) {
    if (await inferAlreadyApplied(file)) {
      await recordMigration(file);
      applied.add(file);
      console.log('Recorded:', file);
    }
  }
}

async function runMigrationFile(filename) {
  const migration = readFileSync(join(root, 'migrations', filename), 'utf8');
  const statements = splitStatements(migration);
  for (const stmt of statements) {
    await sql.query(stmt);
    console.log('OK:', stmt.split('\n')[0].slice(0, 72));
  }
  await recordMigration(filename);
}

await ensureMigrationsTable();
const applied = await appliedFilenames();
await bootstrapExistingDatabase(applied);

let ran = 0;
for (const file of migrationFiles) {
  if (applied.has(file)) {
    console.log(`\n--- ${file} (skip, already applied) ---`);
    continue;
  }

  console.log(`\n--- ${file} ---`);
  await runMigrationFile(file);
  ran += 1;
}

if (ran === 0) {
  console.log('\nNo pending migrations.');
} else {
  console.log(`\nApplied ${ran} migration(s).`);
}
