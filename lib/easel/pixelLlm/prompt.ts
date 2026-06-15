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
  S: 1,
  Y: 2,
  L: 2,
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

/**
 * Human-readable names, keyed identically to FIXED_PALETTE.
 * Single source of truth for the legend the model sees — keep keys in sync
 * with FIXED_PALETTE so the prompt can never document a color the parser
 * rejects (or omit one the parser accepts).
 */
const COLOR_NAMES: Record<string, string> = {
  R: 'Red',
  G: 'Green',
  B: 'Blue',
  Y: 'Yellow',
  O: 'Orange',
  P: 'Purple',
  W: 'White',
  K: 'Black',
  N: 'Brown',
  A: 'LightBlue',
  S: 'Gray',
  L: 'Lime',
};

/** "R=Red G=Green ... , . = empty" — derived, never hand-maintained. */
function buildLegend(): string {
  const pairs = Object.keys(FIXED_PALETTE)
    .map((letter) => `${letter}=${COLOR_NAMES[letter] ?? letter}`)
    .join(' ');
  return `${pairs}, . = empty`;
}

/** Fill colors only (everything except outline/white/empty), for the draw order. */
function buildFillLetters(): string {
  return Object.keys(FIXED_PALETTE)
    .filter((letter) => letter !== 'K' && letter !== 'W')
    .join('/');
}

const SUBJECT_RULES = [
  'SUBJECT: ONE short label only — cat, dog, person, tree, pizza, rocket (1–3 words max).',
  'NEVER draw a sentence, chat line, quote, or seed text. Convert vibes to a single noun first.',
  'ICON TEST: Would a child recognize this in 1 second? If not, simplify.',
  'ONE subject, ONE iconic angle only (side-view car, front-facing face, top-down pizza).',
  'No scenes, no backgrounds, no multiple objects, no text, no emoji.',
].join('\n');

const DRAW_ORDER = [
  'DRAW ORDER — silhouette first:',
  '1. Block in the outer shape with K (black) outline pixels.',
  `2. Fill the body with one or two of: ${buildFillLetters()}.`,
  '3. Add W/Y accents last for eyes, highlights, rays.',
].join('\n');

export function buildGridSystemPrompt(canvasSize: CanvasSize): string {
  const w = canvasSize.width;
  const h = canvasSize.height;
  const legend = buildLegend();

  return `Draw pixel art on a ${w}×${h} canvas. Output ONLY this format, nothing else:

OFFSET:x,y
GRID:
<rows of letters, all the same length>

COLOR LETTERS (use ONLY these): ${legend}

OFFSET means the top-left position of your GRID on the full ${w}×${h} canvas.
- Draw a TIGHT bounding box around the subject: no empty rows or columns on any edge.
- Then center it with the offset:
    x = floor((${w} - gridWidth) / 2)
    y = floor((${h} - gridHeight) / 2)
- The grid must fit inside the canvas: x + gridWidth ≤ ${w}, y + gridHeight ≤ ${h}.

GRID RULES:
- Every row must have EXACTLY the same number of characters. This is mandatory.
- Use '.' for empty/transparent pixels inside the bounding box.
- One GRID only. No text, fences, or commentary outside the OFFSET/GRID format.

${SUBJECT_RULES}

${DRAW_ORDER}

SIZE (natural scale — do not stretch to fill):
- Draw at a comfortable size; clarity beats size.
- Small doodles and larger sketches are both OK.
- The bounding box is tight; centering happens via OFFSET, not padding rows.

NEGATIVE (never do these):
- No words, letters-as-text, numbers, or captions in the grid.
- No sentences from chat seeds or stream titles — draw the THING, not the phrase.
- No full scenes (sky + ground + sun + trees) — one object only.
- No abstract squiggles or random patterns.
- No ragged rows of differing length.

Example "cat" (tight 8-wide box, brown body):
OFFSET:12,10
GRID:
..KKKK..
.KKNNKK.
KNNNNNNK
KNNWWNKK
KNNNNNNK
.KKNNKK.
..KKKK..

Example "side-view car" (tight 14-wide box, K outline + fill):
OFFSET:8,12
GRID:
....KKKKKK....
...KKRRRRKK...
..KKRRRRRRKK..
..KRRWWRRRKK..
..KRRRRRRRKK..
...KKRRRRKK...
....KKKKKK....`;
}

export function buildGridUserPrompt(drawSubject: string): string {
  // System prompt already carries the rules; keep this lean to avoid
  // over-anchoring and token waste.
  return [
    `Draw pixel art of exactly: ${drawSubject}.`,
    'One noun, most recognizable angle. K outline first, then fill.',
  ].join(' ');
}

/** Collapse newlines/quotes and cap length on untrusted stream/chat text. */
function sanitize(text: string, maxLen = 120): string {
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/["'`]/g, '')
    .trim()
    .slice(0, maxLen);
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
  // drawSubject is the already-resolved noun. We deliberately do NOT feed the
  // raw seedPrompt back into the draw prompt — that would reintroduce the
  // injection surface the noun-resolution step exists to remove. Stream title
  // is kept for mood only and sanitized.
  const streamLine = ctx.streamTitle
    ? `Stream playing "${sanitize(ctx.streamTitle)}" — mood only, do not draw the title.`
    : `${sanitize(ctx.channelName)} ambient stream.`;
  const priorLine = ctx.priorTopics.length > 0
    ? `Never draw these (already painted): ${ctx.priorTopics.map((t) => sanitize(t, 40)).join(', ')}.`
    : '';

  return [
    `You are ${sanitize(ctx.npcName, 40)}. ${sanitize(ctx.personalityNotes, 160)}.`,
    `Time: ${sanitize(ctx.skyPeriod, 30)}. ${streamLine}`,
    priorLine,
    `Draw pixel art of exactly: ${drawSubject}.`,
    'One noun, iconic angle. K silhouette first, then fill. No scenes or text.',
  ].filter(Boolean).join(' ');
}