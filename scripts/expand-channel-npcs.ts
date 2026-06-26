/**
 * Expand each stage channel NPC pool to 2× with realistic first names (LLM-generated).
 *
 * Usage: npx tsx scripts/expand-channel-npcs.ts [--channel deep-space] [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  buildNpcGeneratorPrompt,
  dedupeGeneratedNpcs,
  existingCastNames,
  NPC_GENERATOR_MODEL,
  parseGeneratedNpcs,
  type GeneratedNpc,
} from '../lib/npcGenerator';
import type { StageChannel } from '../lib/stageVideos';

const CHANNEL_DIR = join(process.cwd(), 'data', 'generated-npcs', 'channels');

/** Target pool size per channel — 2× previous counts (headliner stays empty). */
const TARGET_COUNTS: Partial<Record<StageChannel, number>> = {
  bumbershoot: 12,
  cinema: 8,
  coachella: 24,
  'deep-space': 12,
  edc: 12,
  forest: 12,
  'outside-lands': 12,
  'silent-disco': 24,
  'which-stage': 16,
};

function readChannel(channel: StageChannel): GeneratedNpc[] {
  try {
    const raw = readFileSync(join(CHANNEL_DIR, `${channel}.json`), 'utf8');
    return JSON.parse(raw) as GeneratedNpc[];
  } catch {
    return [];
  }
}

async function generateForChannel(
  channel: StageChannel,
  count: number,
  extraExistingNames: string[],
): Promise<GeneratedNpc[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('OPENAI_API_KEY is not set');

  const prompt = buildNpcGeneratorPrompt(channel, count, extraExistingNames);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: NPC_GENERATOR_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      max_tokens: 12000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 400)}`);
  }

  const data = await res.json();
  const raw: string | undefined = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty model response');
  return parseGeneratedNpcs(raw);
}

function writeChannel(channel: StageChannel, npcs: GeneratedNpc[]): void {
  writeFileSync(
    join(CHANNEL_DIR, `${channel}.json`),
    `${JSON.stringify(npcs, null, 2)}\n`,
    'utf8',
  );
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const onlyChannel = process.argv.find((a, i) => process.argv[i - 1] === '--channel') as
    | StageChannel
    | undefined;

  const channels = (onlyChannel
    ? [onlyChannel]
    : Object.keys(TARGET_COUNTS)) as StageChannel[];

  for (const channel of channels) {
    const target = TARGET_COUNTS[channel];
    if (target == null || target === 0) continue;

    const current = readChannel(channel);
    if (current.length >= target && !process.argv.includes('--force')) {
      console.log(`[skip] ${channel}: already ${current.length} >= ${target}`);
      continue;
    }

    console.log(`[gen] ${channel}: generating ${target} NPCs (was ${current.length})…`);
    const reserved = [
      ...existingCastNames(),
      ...current.map(n => n.name.toLowerCase()),
    ];
    const npcs = dedupeGeneratedNpcs(
      await generateForChannel(channel, target, reserved),
    );

    if (npcs.length < target) {
      console.warn(`[warn] ${channel}: got ${npcs.length}/${target} after dedupe`);
    }

    if (dryRun) {
      console.log(`[dry-run] ${channel}:`, npcs.map(n => n.name).join(', '));
      continue;
    }

    writeChannel(channel, npcs);
    console.log(`[ok] ${channel}: wrote ${npcs.length} NPCs`);
    await new Promise(r => setTimeout(r, 1500));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
