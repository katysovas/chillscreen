#!/usr/bin/env node
/**
 * Apply migrations/001_festies.sql to Neon.
 * Requires DATABASE_URL in .env.local or environment.
 */
import { readFileSync } from 'fs';
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
import { readdirSync } from 'fs';

const migrationFiles = readdirSync(join(root, 'migrations'))
  .filter(f => f.endsWith('.sql'))
  .sort();

for (const file of migrationFiles) {
  console.log(`\n--- ${file} ---`);
  const migration = readFileSync(join(root, 'migrations', file), 'utf8');
  const withoutComments = migration
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  const statements = withoutComments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await sql.query(stmt);
    console.log('OK:', stmt.split('\n')[0].slice(0, 60));
  }
}

console.log('\nAll migrations complete.');
