import { npcPoolKey, paletteForNpc } from './drawingsPool';
import { completeDrawingJson } from './completeDrawing';
import type { EaselDrawingContext } from './drawingContext';
import { isDuplicateDrawingId, isDuplicateTopic } from './drawingHistory';
import { buildRichFallbackProgram } from './fallbackSketches';
import { logEaselContext, logEaselDrawing } from './logDrawing';
import { totalSegments, validateProgram } from './segments';
import type { DrawingProgram, DrawingStroke } from './types';

export type GeneratedDrawing = {
  program: DrawingProgram;
  totalSegments: number;
};

const MAX_GENERATION_ATTEMPTS = 3;
const MIN_STROKES = 12;
const MIN_SEGMENTS = 22;
const MIN_PALETTE_INDICES = 3;

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

function uniqueDrawingId(npcKey: string): string {
  return `ai_${npcKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
      w: Math.max(2, Math.min(6, Math.floor(Number(row.w) || 3))),
      p,
    });
  }

  const program: DrawingProgram = {
    id: uniqueDrawingId(npcKey),
    npc: npcKey,
    model: ctx.modelId.split('/').pop() ?? 'npc',
    topic,
    strokes,
  };
  return validateProgram(program) ? program : null;
}

function buildSystemPrompt(ctx: EaselDrawingContext, attempt: number): string {
  const streamLine = ctx.streamTitle
    ? `The screen is playing "${ctx.streamTitle}" on ${ctx.channelName}.`
    : `The ${ctx.channelName} stream is ambient background.`;
  const seedLine = ctx.seedPrompt
    ? `Conversation seed: ${ctx.seedPrompt}`
    : 'No seed — invent something from your personality and the moment.';
  const vibeLine = ctx.vibe ? `Vibe: ${ctx.vibe}.` : '';
  const priorLine = ctx.priorTopics.length > 0
    ? `Already painted here (NEVER repeat these subjects or close variants): ${ctx.priorTopics.join('; ')}.`
    : 'No prior paintings on this easel — pick something fresh.';

  return [
    `You are ${ctx.npcName}, sketching on a small 96×96 easel at an outdoor cinema lawn.`,
    `Personality: ${ctx.personalityNotes}`,
    vibeLine,
    `Time of day: ${ctx.skyPeriod}. Let lighting shape the mood (stars at night, long shadows at sunset, soft haze in fog).`,
    streamLine,
    seedLine,
    priorLine,
    `Unique moment id: ${ctx.uniqueNonce}-a${attempt} — new subject required; different from all prior paintings.`,
    '',
    'Think like a quick but thoughtful observational doodle — what would THIS character notice right now?',
    'Good subjects: projector beam, blanket grid from above, wine in a coffee cup, fog rolling in,',
    'marquee lights, lawn chair silhouette, snack tray, couple arguing quietly, jacket someone forgot,',
    'film reel, popcorn bucket detail, string lights, thermos on grass, screen glow on faces.',
    'Never reuse generic defaults (cats, hearts, smiley faces) unless the stream or seed explicitly calls for them.',
    '',
    'Return ONLY valid JSON:',
    '{ "topic": "2-5 word label", "strokes": [ { "pi": 0, "w": 3, "p": [[x,y], ...] }, ... ] }',
    '',
    'Composition rules:',
    '- 18–32 strokes total — lean detailed, not minimal.',
    '- Layer the drawing: background hint → main subject → small telling details (3+ layers).',
    '- Each stroke is a connected polyline with 2–18 integer points (curves need more points).',
    '- Coordinates integers 0–96; fill most of the canvas — avoid tiny centered icons.',
    '- Use ALL palette indices: pi 0 main fill lines, 1 outlines/shadows, 2 accents, 3 highlights/sparkles.',
    '- Mix stroke widths: w=2 fine detail, w=3 body, w=4–5 bold silhouettes.',
    '- Simple line art only — no fills, no text, no emoji — but rich contour and cross-hatching is welcome.',
    '- Subject must reflect personality + time + stream/seed; include at least one small "crowd-watcher" detail.',
    '- Must differ from every item in the already-painted list.',
  ].join('\n');
}

function buildUserPrompt(ctx: EaselDrawingContext): string {
  const mood = ctx.skyPeriod === 'night' ? 'night sky, screen glow'
    : ctx.skyPeriod === 'evening' ? 'golden hour warmth'
      : ctx.skyPeriod === 'morning' ? 'soft morning light'
        : 'clear open-air mood';
  return [
    `Sketch one cohesive scene or object for the easel now.`,
    `Mood: ${mood}.`,
    ctx.streamTitle ? `Echo something from "${ctx.streamTitle}" without copying it literally.` : '',
    `Be specific to ${ctx.npcName}'s point of view — not a generic clipart doodle.`,
  ].filter(Boolean).join(' ');
}

function programIsTooSimple(program: DrawingProgram): boolean {
  if (program.strokes.length < MIN_STROKES) return true;
  if (totalSegments(program) < MIN_SEGMENTS) return true;
  const paletteUsed = new Set(program.strokes.map(s => s.pi ?? 0));
  return paletteUsed.size < MIN_PALETTE_INDICES;
}

function programIsDuplicate(program: DrawingProgram, ctx: EaselDrawingContext): boolean {
  return isDuplicateTopic(program.topic, ctx.priorTopics)
    || isDuplicateDrawingId(program.id, ctx.priorDrawingIds);
}

/** Minimal fallback when LLM is unavailable — still avoids prior topics. */
function fallbackProgram(ctx: EaselDrawingContext): DrawingProgram {
  return buildRichFallbackProgram(ctx);
}

async function generateOnce(
  ctx: EaselDrawingContext,
  attempt: number,
): Promise<{ program: DrawingProgram; source: 'ai' | 'fallback' } | null> {
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(ctx, attempt) },
    { role: 'user' as const, content: buildUserPrompt(ctx) },
  ];
  const raw = await completeDrawingJson(ctx.modelId, messages);

  if (raw) {
    try {
      const program = normalizeProgram(extractJsonObject(raw) as Record<string, unknown>, ctx);
      if (program && programIsDuplicate(program, ctx)) {
        console.warn('[easel:server] duplicate topic from LLM, retrying', program.topic);
      } else if (program && programIsTooSimple(program)) {
        console.warn('[easel:server] sketch too simple, retrying', {
          strokes: program.strokes.length,
          segments: totalSegments(program),
        });
      } else if (program) {
        return { program, source: 'ai' };
      }
    } catch {
      /* retry */
    }
  }
  return null;
}

export async function generateDrawingProgram(ctx: EaselDrawingContext): Promise<GeneratedDrawing> {
  logEaselContext(ctx);

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const hit = await generateOnce(ctx, attempt);
    if (hit) {
      void paletteForNpc(hit.program.npc);
      const total = totalSegments(hit.program);
      logEaselDrawing('server', ctx.npcId, hit.program.topic, {
        source: hit.source,
        model: ctx.modelId,
        strokes: hit.program.strokes.length,
        segments: total,
        attempt: attempt + 1,
      });
      return { program: hit.program, totalSegments: total };
    }
  }

  console.warn('[easel:server] LLM drawing failed or repeated — using unique fallback', ctx.npcId);
  let program = fallbackProgram(ctx);
  if (programIsDuplicate(program, ctx)) {
    program = { ...program, topic: `sketch ${Date.now()}`, id: uniqueDrawingId(program.npc).replace(/^ai_/, 'fb_') };
  }

  void paletteForNpc(program.npc);
  const total = totalSegments(program);
  logEaselDrawing('server', ctx.npcId, program.topic, {
    source: 'fallback',
    model: ctx.modelId,
    strokes: program.strokes.length,
    segments: total,
  });
  return { program, totalSegments: total };
}
