/** Adapted from https://github.com/mxmarchal/pixel-llm (MIT) */

import type { CanvasSize } from './types';

/** Letter → easel palette index (0=dark, 3=highlight). */
export const LETTER_TO_PI: Record<string, number> = {
  K: 0,
  N: 0,
  R: 1,
  G: 1,
  B: 1,
  O: 1,
  P: 1,
  L: 1,
  Y: 2,
  S: 2,
  W: 3,
  A: 3,
};

/** Fixed color letters — model outputs these in the GRID rows. */
export const FIXED_PALETTE: Record<string, string> = {
  R: '#ff0000',
  G: '#00aa00',
  B: '#0066ff',
  Y: '#ffdd00',
  O: '#ff8800',
  P: '#aa00aa',
  W: '#ffffff',
  K: '#000000',
  N: '#8b4513',
  A: '#88ccff',
  S: '#aaaaaa',
  L: '#00ff00',
};

const SUBJECT_RULES = [
  'SUBJECT: ONE short label only — cat, dog, person, tree, pizza, rocket (1–3 words max).',
  'NEVER draw a sentence, chat line, quote, or seed text. Convert vibes to a single noun first.',
  'ICON TEST: Would a child recognize this in 1 second? If not, simplify.',
  'ONE subject, ONE iconic angle only (side-view car, front-facing face, top-down pizza).',
  'No scenes, no backgrounds, no multiple objects, no text, no emoji.',
  'Never a tiny icon floating in the center — the subject must dominate the grid.',
].join('\n');

const DRAW_ORDER = [
  'DRAW ORDER — silhouette first:',
  '1. Block in the outer shape with K (black) outline pixels.',
  '2. Fill the body with R/G/B/Y/O/N.',
  '3. Add W/Y accents last for eyes, highlights, rays.',
].join('\n');

export function buildGridSystemPrompt(canvasSize: CanvasSize): string {
  const w = canvasSize.width;
  const h = canvasSize.height;
  const minRows = Math.max(20, Math.floor(h * 0.75));

  return `Draw pixel art on a ${w}×${h} canvas. Output ONLY this format, nothing else:

OFFSET:2,2
GRID:
(use letters: R=Red G=Green B=Blue Y=Yellow O=Orange W=White K=Black N=Brown, . = empty)

${SUBJECT_RULES}

${DRAW_ORDER}

CRITICAL — SIZE:
- Fill at least ${minRows} rows AND ${minRows} columns with the subject.
- Leave only a 2–4 pixel margin — NOT a tiny centered icon.
- Start near OFFSET:2,2. The drawing should nearly touch all four edges.

NEGATIVE (never do these):
- No words, letters as text, numbers, or captions in the grid.
- No sentences from chat seeds or stream titles — draw the THING, not the phrase.
- No full scenes (sky + ground + sun + trees) — one object only.
- No abstract squiggles or random patterns.

Rules: ONE grid only. No text outside the format.

Example "side-view car" (large, K outline + fill, iconic angle):
OFFSET:2,4
GRID:
................
....KKKKKKKK.....
...KKRRRRRRKK....
..KKRRRRRRRRKK...
..KRRRRRRRRRRK...
..KRRWW..WWRKK...
..KRRWW..WWRKK...
..KRRRRRRRRRRK...
..KKRRRRRRRRKK...
...KKRRRRRRKK....
....KKKKKKKK.....
.....KK..KK......

Example "front face" (K outline first, then fill):
OFFSET:6,2
GRID:
....KKKKKKKK....
...KKRRRRRRKK...
..KKRRRRRRRRKK..
..KRRWWRRWWRK..
..KRRWWRRWWRK..
..KRRRRRRRRRK..
..KKRRRRRRRKK..
...KKRRRRRKK...
....KKKKKKK.....`;
}

export function buildGridUserPrompt(drawSubject: string): string {
  return [
    `Draw BIG pixel art of exactly: ${drawSubject}.`,
    'One noun only — not a sentence, not a chat line.',
    'Pick the most recognizable angle (side car, front face, top-down food).',
    'K outline first, then fill — fill almost the entire 32×32 grid edge-to-edge.',
    'Icon test: a child must recognize it instantly.',
  ].join(' ');
}

export function buildAmbientGridUserPromptParts(
  ctx: {
    npcName: string;
    personalityNotes: string;
    skyPeriod: string;
    streamTitle: string | null;
    channelName: string;
    seedPrompt: string | null;
    priorTopics: string[];
  },
  drawSubject: string,
): string {
  const streamLine = ctx.streamTitle
    ? `Stream playing "${ctx.streamTitle}" — mood only, do not draw the title.`
    : `${ctx.channelName} ambient stream.`;
  const seedLine = ctx.seedPrompt
    ? `Nearby chat: "${ctx.seedPrompt}" — inspiration only; do NOT draw those words.`
    : '';
  const priorLine = ctx.priorTopics.length > 0
    ? `Never draw these (already painted): ${ctx.priorTopics.join(', ')}.`
    : '';
  return [
    `You are ${ctx.npcName}. ${ctx.personalityNotes}.`,
    `Time: ${ctx.skyPeriod}. ${streamLine} ${seedLine}`,
    priorLine,
    `Subject to draw (exactly this short label): ${drawSubject}`,
    `Draw BIG pixel art of: ${drawSubject}.`,
    'K silhouette first, then fill. One noun, iconic angle. No scenes or text.',
    'Fill almost the entire 32×32 grid — large, edge-to-edge.',
  ].filter(Boolean).join(' ');
}
