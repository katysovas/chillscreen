#!/usr/bin/env npx tsx
/**
 * Convert stage preset images under public/images/stages/ to optimized WebP.
 *
 * Usage:
 *   npm run optimize:stage-images
 *   npm run optimize:stage-images -- --remove-originals
 */
import { readdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import { optimizeStageImage } from '../lib/stages/stageImageOptimize';

const STAGES_DIR = join(process.cwd(), 'public', 'images', 'stages');
const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png']);
const removeOriginals = process.argv.includes('--remove-originals');

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  const entries = await readdir(STAGES_DIR);
  let converted = 0;
  let skipped = 0;
  let savedBytes = 0;

  for (const name of entries.sort()) {
    const ext = extname(name).toLowerCase();
    if (!SOURCE_EXTS.has(ext)) continue;

    const srcPath = join(STAGES_DIR, name);
    const stem = basename(name, ext);
    const outPath = join(STAGES_DIR, `${stem}.webp`);

    const srcStat = await stat(srcPath);
    const input = await readFile(srcPath);
    const optimized = await optimizeStageImage(input);
    await writeFile(outPath, optimized.buffer);

    const outStat = await stat(outPath);
    const delta = srcStat.size - outStat.size;
    savedBytes += Math.max(0, delta);
    converted += 1;

    console.log(
      `${name} → ${stem}.webp  `
      + `${formatBytes(srcStat.size)} → ${formatBytes(outStat.size)} `
      + `(${optimized.width}×${optimized.height})`,
    );

    if (removeOriginals) {
      await unlink(srcPath);
    }
  }

  const webpOnly = entries.filter(n => n.endsWith('.webp')).length;
  if (converted === 0) {
    console.log(`No JPG/PNG sources found in ${STAGES_DIR} (${webpOnly} WebP already present).`);
    skipped = webpOnly;
  } else {
    console.log(`\nConverted ${converted} file(s), saved ~${formatBytes(savedBytes)}.`);
    if (!removeOriginals) {
      console.log('Originals kept — re-run with --remove-originals to delete source JPG/PNG files.');
    }
  }

  if (skipped && converted === 0) {
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
