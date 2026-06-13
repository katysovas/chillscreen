import { npcPoolKey, paletteForNpc } from './drawingsPool';
import { completeDrawingJson } from './completeDrawing';
import type { EaselDrawingContext } from './drawingContext';
import { totalSegments, validateProgram } from './segments';
import type { DrawingProgram, DrawingStroke } from './types';

export type GeneratedDrawing = {
  program: DrawingProgram;
  totalSegments: number;
};

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('invalid json');
  }
}

function normalizeProgram(
  parsed: Record<string, unknown>,
  ctx: EaselDrawingContext,
): DrawingProgram | null {
  const npcKey = npcPoolKey(ctx.npcId);
  const topic = typeof parsed.topic === 'string' && parsed.topic.trim()
    ? parsed.topic.trim().slice(0, 48)
    : 'sketch';
  const strokesRaw = parsed.strokes;
  if (!Array.isArray(strokesRaw)) return null;

  const strokes: DrawingStroke[] = [];
  for (const s of strokesRaw) {
    if (!s || typeof s !== 'object') continue;
    const row = s as Record<string, unknown>;
    const pts = row.p;
    if (!Array.isArray(pts) || pts.length < 2) continue;
    const p: [number, number][] = [];
    for (const pt of pts) {
      if (!Array.isArray(pt) || pt.length !== 2) continue;
      const x = Math.max(0, Math.min(96, Math.round(Number(pt[0]))));
      const y = Math.max(0, Math.min(96, Math.round(Number(pt[1]))));
      p.push([x, y]);
    }
    if (p.length < 2) continue;
    strokes.push({
      pi: Math.max(0, Math.min(3, Math.floor(Number(row.pi) || 0))),
      w: Math.max(2, Math.min(5, Math.floor(Number(row.w) || 3))),
      p,
    });
  }

  const program: DrawingProgram = {
    id: `ai_${npcKey}_${Date.now()}`,
    npc: npcKey,
    model: ctx.modelId.split('/').pop() ?? 'npc',
    topic,
    strokes,
  };
  return validateProgram(program) ? program : null;
}

function buildSystemPrompt(ctx: EaselDrawingContext): string {
  const streamLine = ctx.streamTitle
    ? `The screen is playing "${ctx.streamTitle}" on ${ctx.channelName}.`
    : `The ${ctx.channelName} stream is ambient background.`;
  const seedLine = ctx.seedPrompt
    ? `Conversation seed: ${ctx.seedPrompt}`
    : 'No seed — invent something from your personality and the moment.';

  return [
    `You are ${ctx.npcName}, sketching on a small 96×96 easel at an outdoor cinema.`,
    `Personality: ${ctx.personalityNotes}`,
    `Time of day: ${ctx.skyPeriod}.`,
    streamLine,
    seedLine,
    `Unique moment id: ${ctx.uniqueNonce} — pick a fresh, specific subject; never default to cats or generic icons unless the moment truly calls for it.`,
    '',
    'Return ONLY valid JSON:',
    '{ "topic": "2-4 word label", "strokes": [ { "pi": 0, "w": 3, "p": [[x,y], ...] }, ... ] }',
    '',
    'Rules:',
    '- 6–14 strokes total; each stroke is a connected polyline (2–12 points).',
    '- Coordinates integers 0–96; compose a recognizable doodle (face, object, scene fragment).',
    '- pi = palette index 0–3 (0 main, 1 outline, 2 accent, 3 highlight).',
    '- w = stroke width 2–4.',
    '- Simple line art — no fills, no text, no emoji.',
    '- Subject must reflect personality + time + stream/seed right now.',
  ].join('\n');
}

/** Minimal fallback when LLM is unavailable. */
function fallbackProgram(ctx: EaselDrawingContext): DrawingProgram {
  const npcKey = npcPoolKey(ctx.npcId);
  const topic = ctx.streamTitle?.split(/\s+/).slice(0, 2).join(' ') || ctx.skyPeriod;
  return {
    id: `fb_${npcKey}_${Date.now()}`,
    npc: npcKey,
    model: 'fallback',
    topic,
    strokes: [
      { pi: 0, w: 3, p: [[20, 70], [76, 70], [76, 30], [20, 30], [20, 70]] },
      { pi: 1, w: 2, p: [[30, 45], [66, 45]] },
      { pi: 2, w: 2, p: [[38, 55], [40, 57]] },
      { pi: 2, w: 2, p: [[56, 55], [54, 57]] },
      { pi: 1, w: 2, p: [[48, 62], [52, 64], [48, 66]] },
    ],
  };
}

export async function generateDrawingProgram(ctx: EaselDrawingContext): Promise<GeneratedDrawing> {
  const system = buildSystemPrompt(ctx);
  const raw = await completeDrawingJson(ctx.modelId, [{ role: 'system', content: system }]);

  let program: DrawingProgram | null = null;
  if (raw) {
    try {
      program = normalizeProgram(extractJsonObject(raw) as Record<string, unknown>, ctx);
    } catch {
      program = null;
    }
  }

  if (!program) {
    console.warn('[easel] LLM drawing failed — using fallback', ctx.npcId);
    program = fallbackProgram(ctx);
  }

  void paletteForNpc(program.npc);
  return { program, totalSegments: totalSegments(program) };
}
