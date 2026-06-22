import type { EaselDrawingContext } from '@/lib/easel/drawingContext';
import { npcPoolKey } from '@/lib/easel/drawingsPool';
import { easelChannelForStageSlug } from '@/lib/easel/stageChannel';
import { normalizeEaselStage } from '@/lib/easel/stageKey';
import type { GeneratedDrawing } from '@/lib/easel/generateDrawing';
import { DOODLE_IMAGE_MODEL } from './imageGen';
import { manifestEntryForNpc } from './manifest';
import { paletteForStageChannel } from './palettes';
import type { DoodleSpriteProgram } from '@/lib/easel/types';

export function isDoodleSpriteProgram(value: unknown): value is DoodleSpriteProgram {
  return Boolean(
    value
    && typeof value === 'object'
    && (value as DoodleSpriteProgram).kind === 'doodle-sprite'
    && typeof (value as DoodleSpriteProgram).gridPath === 'string',
  );
}

export function doodleTotalSegments(program: DoodleSpriteProgram): number {
  if (program.revealMode === 'band') return 12;
  return program.w * program.h;
}

export function manifestEntryToProgram(
  entry: {
    id: string;
    npc: string;
    subject: string;
    grid: string;
    sprite: string;
    w: number;
    h: number;
  },
  palette: string[],
  bgHex: string,
): DoodleSpriteProgram {
  return {
    kind: 'doodle-sprite',
    id: entry.id,
    npc: entry.npc,
    model: DOODLE_IMAGE_MODEL,
    topic: entry.subject,
    gridPath: entry.grid,
    spritePath: entry.sprite,
    w: entry.w,
    h: entry.h,
    palette,
    bgHex,
    revealMode: 'stipple',
  };
}

/** Pick a curated static doodle from the manifest when available. */
export async function tryGenerateManifestDoodle(
  ctx: EaselDrawingContext,
  stageSlug: string,
): Promise<GeneratedDrawing | null> {
  const stageKey = normalizeEaselStage(stageSlug);
  const entry = manifestEntryForNpc(stageKey, ctx.npcId, []);
  if (!entry) return null;

  const channel = await easelChannelForStageSlug(stageKey);
  const stagePalette = paletteForStageChannel(channel);
  const program = manifestEntryToProgram(entry, stagePalette.palette, stagePalette.bgHex);
  return {
    program,
    totalSegments: doodleTotalSegments(program),
  };
}

export function npcKeyFromProgram(program: unknown): string | null {
  if (!program || typeof program !== 'object') return null;
  const npc = (program as { npc?: string }).npc;
  return npc?.trim() || null;
}

export function topicFromArtProgram(program: unknown): string | null {
  if (!program || typeof program !== 'object') return null;
  const topic = (program as { topic?: string }).topic;
  return topic?.trim() || null;
}
