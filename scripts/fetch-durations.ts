/**
 * Fetches real video durations from the YouTube Data API v3 and patches
 * lib/stageVideos.ts in-place with correct `durationSec` values.
 *
 * Usage:
 *   npx tsx scripts/fetch-durations.ts [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(root, '.env.local');
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key?.trim() && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
} catch { /* optional */ }

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) { console.error('YOUTUBE_API_KEY not set'); process.exit(1); }

const DRY_RUN = process.argv.includes('--dry-run');

// ── Parse ISO 8601 duration → seconds ───────────────────────────────────────

/**
 * Videos longer than 8 hours are treated as "streams" (omit durationSec so
 * they fall back to DEFAULT_DURATION_MS = 1 hour). Lo-Fi Girl Radio etc. are
 * technically finite but accumulate thousands of hours in archives.
 */
const MAX_USEFUL_SEC = 8 * 60 * 60;

function parseDuration(iso: string): number | null {
  if (!iso || iso === 'P0D' || iso === 'PT0S' || iso === 'PT') return null;
  const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, d, h, min, s] = m.map(v => parseInt(v ?? '0', 10) || 0);
  const total = d * 86400 + h * 3600 + min * 60 + s;
  return total > 0 && total <= MAX_USEFUL_SEC ? total : null;
}

// ── Extract all unique video IDs from stageVideos.ts ────────────────────────

const stageVideosPath = resolve(root, 'lib/stageVideos.ts');
let source = readFileSync(stageVideosPath, 'utf8');

// Find all id: '...' occurrences inside STAGE_PLAYLISTS.
const idMatches = source.matchAll(/id:\s*'([A-Za-z0-9_-]{11})'/g);
const allIds = [...new Set([...idMatches].map(m => m[1]))];

console.log(`\nFetching durations for ${allIds.length} video IDs: ${allIds.join(', ')}\n`);

// ── Fetch in batches of 50 ───────────────────────────────────────────────────

async function main() {
  const durations = new Map<string, number | null>();

  for (let i = 0; i < allIds.length; i += 50) {
    const batch = allIds.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`API error ${res.status}:`, await res.text());
      process.exit(1);
    }
    const data = await res.json() as {
      items: { id: string; contentDetails: { duration: string } }[];
    };
    for (const item of data.items) {
      durations.set(item.id, parseDuration(item.contentDetails.duration));
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────────

  console.log('Results:');
  for (const [id, sec] of durations) {
    if (sec == null) {
      console.log(`  ${id}  → stream / too long  (will use DEFAULT_DURATION_MS)`);
    } else {
      console.log(`  ${id}  → ${sec}s  (${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m ${sec%60}s)`);
    }
  }
  console.log();

  // ── Patch stageVideos.ts ───────────────────────────────────────────────────
  // Strategy: for each known id replace the whole { id: '...', title: '...', ... }
  // object literal to include / remove durationSec.

  let patched = source;

  for (const [id, sec] of durations) {
    // Match the object literal line(s) for this id.
    // E.g. { id: 'xxx', title: 'Foo', durationSec: 1234 }
    const lineRe = new RegExp(
      `(\\{\\s*id:\\s*'${id}'\\s*,\\s*title:\\s*'[^']*')(?:\\s*,\\s*durationSec:\\s*\\d+)?\\s*(\\})`,
      'g',
    );
    if (sec == null) {
      // Remove durationSec (or keep absent).
      patched = patched.replace(lineRe, '$1 $2');
    } else {
      // Add / replace durationSec.
      patched = patched.replace(lineRe, `$1, durationSec: ${sec} $2`);
    }
  }

  if (patched === source) {
    console.log('No changes needed — stageVideos.ts is already up to date.');
    return;
  }

  if (DRY_RUN) {
    console.log('--- DRY RUN: changes that would be applied ---');
    console.log(patched);
  } else {
    writeFileSync(stageVideosPath, patched);
    console.log('✓ lib/stageVideos.ts updated with real video durations.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
