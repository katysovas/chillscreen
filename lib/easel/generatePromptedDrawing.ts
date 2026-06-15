import { getChatterCharacter, resolveNpcModelId } from '@/lib/chatterCast';
import { resolveDrawingModelId } from './drawingModel';
import { completeDrawingJson } from './completeDrawing';
import { generatePixelGridDrawingProgram, isPixelLlmGridModel, resolvePixelLlmBackendModel } from './generatePixelGridDrawing';
import { buildRichFallbackProgram } from './fallbackSketches';
import { logEaselDrawing } from './logDrawing';
import { npcPoolKey, paletteForNpc } from './drawingsPool';
import { totalSegments, validateProgram } from './segments';
import type { DrawingProgram, DrawingStroke } from './types';
import type { GeneratedDrawing } from './generateDrawing';

const MAX_GENERATION_ATTEMPTS = 2;
const MIN_STROKES = 10;
const MIN_SEGMENTS = 18;
const MIN_PALETTE_INDICES = 2;

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
  return `prompt_${npcKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeProgram(
  parsed: Record<string, unknown>,
  npcKey: string,
  userPrompt: string,
  modelId: string,
): DrawingProgram | null {
  const topic = typeof parsed.topic === 'string' && parsed.topic.trim()
    ? parsed.topic.trim().slice(0, 48)
    : userPrompt.slice(0, 48);
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
    model: modelId.split('/').pop() ?? modelId,
    topic,
    strokes,
  };
  return validateProgram(program) ? program : null;
}

function buildSystemPrompt(npcName: string, userPrompt: string): string {
  return [
    `You are ${npcName}, sketching on a small 96×96 easel because a player asked you to draw something.`,
    `Draw ONLY what the player asked for: "${userPrompt}".`,
    'Ignore any other creative rules — the player prompt is the only subject.',
    '',
    'Return ONLY valid JSON:',
    '{ "topic": "short label", "strokes": [ { "pi": 0, "w": 3, "p": [[x,y], ...] }, ... ] }',
    '',
    'Stroke format:',
    '- 14–28 strokes — enough detail to read the subject.',
    '- Each stroke is a connected polyline with 2–18 integer points.',
    '- Coordinates integers 0–96; center the subject and fill most of the canvas.',
    '- Simple line art — no fills, no text, no emoji.',
    '- Use palette indices pi 0–3 for outlines, body, accents.',
    '- Mix stroke widths: w=2 details, w=3 body, w=4–5 bold silhouettes.',
    '- Pick the iconic view that makes the subject instantly recognizable.',
  ].join('\n');
}

function buildUserPrompt(userPrompt: string): string {
  return `Draw exactly this: ${userPrompt}. One clear subject, centered, filling the frame.`;
}

function programIsTooSimple(program: DrawingProgram): boolean {
  if (program.strokes.length < MIN_STROKES) return true;
  if (totalSegments(program) < MIN_SEGMENTS) return true;
  const paletteUsed = new Set(program.strokes.map(s => s.pi ?? 0));
  return paletteUsed.size < MIN_PALETTE_INDICES;
}

function fallbackProgram(npcId: string, userPrompt: string): DrawingProgram {
  const npcKey = npcPoolKey(npcId);
  const ch = getChatterCharacter(npcId);
  const base = buildRichFallbackProgram({
    npcId,
    npcName: ch?.name ?? npcKey,
    modelId: ch ? resolveNpcModelId(ch) : 'openai/gpt-4.1-nano',
    vibe: null,
    personalityNotes: ch?.personalityNotes?.trim() || 'friendly festival regular',
    skyPeriod: 'day',
    streamTitle: null,
    channelName: 'street',
    seedPrompt: userPrompt,
    seedKind: 'topic',
    uniqueNonce: String(Date.now()),
    priorTopics: [],
    priorDrawingIds: [],
  });
  return {
    ...base,
    id: uniqueDrawingId(npcKey),
    topic: userPrompt.slice(0, 48),
  };
}

/** Generate a drawing driven only by the player's chat prompt. */
export async function generatePromptedDrawingProgram(
  npcId: string,
  userPrompt: string,
  opts?: { modelId?: string },
): Promise<GeneratedDrawing> {
  const npcKey = npcPoolKey(npcId);
  const ch = getChatterCharacter(npcId);
  const npcName = ch?.name ?? npcId.split('-').pop() ?? npcId;
  const modelId = opts?.modelId ?? resolveDrawingModelId(npcId);

  if (isPixelLlmGridModel(modelId)) {
    return generatePixelGridDrawingProgram(npcId, userPrompt, {
      backendModel: resolvePixelLlmBackendModel(modelId),
    });
  }

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const messages = [
      { role: 'system' as const, content: buildSystemPrompt(npcName, userPrompt) },
      { role: 'user' as const, content: buildUserPrompt(userPrompt) },
    ];
    const raw = await completeDrawingJson(modelId, messages);
    if (!raw) continue;

    try {
      const program = normalizeProgram(
        extractJsonObject(raw) as Record<string, unknown>,
        npcKey,
        userPrompt,
        modelId,
      );
      if (program && !programIsTooSimple(program)) {
        void paletteForNpc(npcKey);
        const total = totalSegments(program);
        logEaselDrawing('server', npcId, program.topic, {
          source: 'prompt-ai',
          model: modelId,
          strokes: program.strokes.length,
          segments: total,
          prompt: userPrompt.slice(0, 80),
        });
        return { program, totalSegments: total };
      }
    } catch {
      /* retry */
    }
  }

  const program = fallbackProgram(npcId, userPrompt);
  void paletteForNpc(npcKey);
  const total = totalSegments(program);
  logEaselDrawing('server', npcId, program.topic, {
    source: 'prompt-fallback',
    strokes: program.strokes.length,
    segments: total,
    prompt: userPrompt.slice(0, 80),
  });
  return { program, totalSegments: total };
}
