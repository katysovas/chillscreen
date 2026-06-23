#!/usr/bin/env npx tsx
/**
 * Offline NPC doodle batch — image-gen → quantize → QC → static assets + manifest.
 * Usage:
 *   npm run doodles:generate -- --fixture forest jenna
 *   npm run doodles:generate -- --stage forest --limit 3
 *   npm run doodles:generate -- --all
 *
 * Requires OPENROUTER_API_KEY in env (or .env.local via shell wrapper).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { easelNpcIdForName, CHANNEL_NPC_POOL } from '../lib/easel/stageNpcPool';
import { npcPoolKey } from '../lib/easel/drawingsPool';
import { pickFixationSubject } from '../lib/easel/doodle/fixation';
import { buildDoodleImagePrompt } from '../lib/easel/doodle/prompt';
import { generateDoodleRaster } from '../lib/easel/doodle/imageGen';
import { quantizeRasterToGrid, renderGridToSpritePng, validateGrid } from '../lib/easel/doodle/quantize';
import { scoreDoodleRecognizability } from '../lib/easel/doodle/qc';
import { structuralGridCheck } from '../lib/easel/doodle/structuralQc';
import { paletteForStageChannel } from '../lib/easel/doodle/palettes';
import type { DoodleGridFile, DoodleManifest, DoodleManifestEntry } from '../lib/easel/doodle/types';
import { DOODLE_TRANSPARENT } from '../lib/easel/doodle/types';
import type { StageChannel } from '../lib/stageVideos';

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data/doodle-manifest.json');
const PUBLIC_DOODLES = path.join(ROOT, 'public/doodles');

const CHANNEL_STAGE_SLUG: Record<StageChannel, string> = {
  forest: 'forest',
  'silent-disco': 'silent-disco',
  coachella: 'coachella',
  edc: 'lasvegas',
  bumbershoot: 'seattle-concerts',
  'outside-lands': 'outside-hands',
  cinema: 'cinema',
  'deep-space': 'deep-space',
  'which-stage': 'tentaroo',
  hula: 'hula',
  headliner: 'headliner',
};

const MAX_RETRIES = 2;

type CliOpts = {
  all: boolean;
  fixture: boolean;
  dryRun: boolean;
  stage?: string;
  npc?: string;
  limit: number;
};

function parseArgs(): CliOpts {
  const args = process.argv.slice(2);
  const opts: CliOpts = { all: false, fixture: false, dryRun: false, limit: 1 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--all') opts.all = true;
    else if (a === '--fixture') opts.fixture = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--stage') opts.stage = args[++i];
    else if (a === '--npc') opts.npc = args[++i];
    else if (a === '--limit') opts.limit = Math.max(1, Number(args[++i]) || 1);
  }
  return opts;
}

function fixtureGrid(subject: string, palette: string[], bgHex: string): DoodleGridFile {
  const w = 16;
  const h = 16;
  const rows: number[][] = Array.from({ length: h }, () => Array(w).fill(DOODLE_TRANSPARENT));
  const fill = (x: number, y: number, pi: number) => {
    if (x >= 0 && x < w && y >= 0 && y < h) rows[y]![x] = pi;
  };
  const cx = 8;
  const cy = 9;
  for (let y = 4; y <= 12; y++) {
    for (let x = 6; x <= 10; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= 12) fill(x, y, 2);
    }
  }
  for (let y = 2; y <= 5; y++) fill(cx, y, 3);
  fill(cx - 1, 3, 4);
  fill(cx + 1, 3, 4);
  return { w, h, palette, bgHex, rows };
}

async function writeDoodleAssets(
  stageSlug: string,
  npcKey: string,
  cycle: string,
  grid: DoodleGridFile,
  spritePng: Buffer,
): Promise<{ gridPath: string; spritePath: string }> {
  const dir = path.join(PUBLIC_DOODLES, stageSlug, npcKey, cycle);
  await fs.mkdir(dir, { recursive: true });
  const gridPath = `/doodles/${stageSlug}/${npcKey}/${cycle}/grid.json`;
  const spritePath = `/doodles/${stageSlug}/${npcKey}/${cycle}/sprite.png`;
  await fs.writeFile(path.join(dir, 'grid.json'), JSON.stringify(grid, null, 2));
  await fs.writeFile(path.join(dir, 'sprite.png'), spritePng);
  return { gridPath, spritePath };
}

async function generateOne(opts: {
  channel: StageChannel;
  stageSlug: string;
  npcId: string;
  npcName: string;
  cycle: string;
  fixture: boolean;
  dryRun: boolean;
}): Promise<DoodleManifestEntry | null> {
  const { channel, stageSlug, npcId, npcName, cycle, fixture, dryRun } = opts;
  const npcKey = npcPoolKey(npcId);
  const stagePalette = paletteForStageChannel(channel);
  const subject = pickFixationSubject(channel, npcId);
  console.log(`[doodle] ${stageSlug}/${npcKey} — ${subject}${fixture ? ' (fixture)' : ''}`);

  if (dryRun) {
    console.log('  dry-run — skip');
    return null;
  }

  let grid: DoodleGridFile | null = null;
  let spritePng: Buffer | null = null;
  let score = 0;

  if (fixture) {
    grid = fixtureGrid(subject, stagePalette.palette, stagePalette.bgHex);
    spritePng = await renderGridToSpritePng(grid, 4);
    score = 8;
  } else {
    const prompt = buildDoodleImagePrompt(subject, stagePalette.bgHex);
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const raster = await generateDoodleRaster(prompt);
      if (!raster) {
        console.warn(`  attempt ${attempt + 1}: image gen failed`);
        continue;
      }
      const quantized = await quantizeRasterToGrid(raster, {
        palette: stagePalette.palette,
        bgHex: stagePalette.bgHex,
        gridW: stagePalette.gridSize,
        gridH: stagePalette.gridSize,
      });
      if (!quantized || !validateGrid(quantized.grid)) {
        console.warn(`  attempt ${attempt + 1}: quantize failed`);
        continue;
      }
      const structural = structuralGridCheck(quantized.grid);
      if (!structural.pass) {
        console.warn(`  attempt ${attempt + 1}: structural — ${structural.reason}`);
        continue;
      }
      const qc = await scoreDoodleRecognizability(quantized.grid, subject);
      console.log(`  attempt ${attempt + 1}: qc score ${qc.score} (${qc.pass ? 'keep' : 'drop'})`);
      if (!qc.pass) continue;
      grid = quantized.grid;
      spritePng = quantized.spritePng;
      score = qc.score;
      break;
    }
  }

  if (!grid || !spritePng) {
    console.warn(`  dropped — no acceptable doodle for ${npcName}`);
    return null;
  }

  const { gridPath, spritePath } = await writeDoodleAssets(stageSlug, npcKey, cycle, grid, spritePng);
  return {
    id: `${stageSlug}-${npcKey}-${cycle}-${subject.replace(/\s+/g, '-')}`,
    npc: npcKey,
    subject,
    grid: gridPath,
    sprite: spritePath,
    score,
    w: grid.w,
    h: grid.h,
  };
}

async function loadManifest(): Promise<DoodleManifest> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8');
    return JSON.parse(raw) as DoodleManifest;
  } catch {
    return { cycle: 'curated', stages: {} };
  }
}

async function saveManifest(manifest: DoodleManifest): Promise<void> {
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function main() {
  const cli = parseArgs();
  const cycle = new Date().toISOString().slice(0, 10);
  const manifest = await loadManifest();
  manifest.cycle = cli.fixture ? 'curated' : cycle;

  const jobs: { channel: StageChannel; stageSlug: string; npcId: string; npcName: string }[] = [];

  for (const [channel, npcs] of Object.entries(CHANNEL_NPC_POOL) as [StageChannel, typeof CHANNEL_NPC_POOL[StageChannel]][]) {
    const stageSlug = CHANNEL_STAGE_SLUG[channel];
    if (cli.stage && stageSlug !== cli.stage) continue;
    for (const npc of npcs) {
      const npcId = easelNpcIdForName(channel, npc.name);
      const npcKey = npcPoolKey(npcId);
      if (cli.npc && cli.npc !== npcKey && cli.npc !== npc.name) continue;
      jobs.push({ channel, stageSlug, npcId, npcName: npc.name });
    }
  }

  const selected = cli.all ? jobs : jobs.slice(0, cli.limit);
  if (selected.length === 0) {
    console.error('No NPC jobs matched filters.');
    process.exit(1);
  }

  for (const job of selected) {
    const entry = await generateOne({
      ...job,
      cycle: manifest.cycle,
      fixture: cli.fixture,
      dryRun: cli.dryRun,
    });
    if (!entry) continue;
    if (!manifest.stages[job.stageSlug]) manifest.stages[job.stageSlug] = { easels: [] };
    const easels = manifest.stages[job.stageSlug]!.easels;
    const idx = easels.findIndex(e => e.npc === entry.npc);
    if (idx >= 0) easels[idx] = entry;
    else easels.push(entry);
    console.log(`  ✓ ${entry.sprite}`);
  }

  if (!cli.dryRun) {
    await saveManifest(manifest);
    console.log(`\nManifest → ${MANIFEST_PATH}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
