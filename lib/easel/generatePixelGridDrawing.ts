/**
 * pixel-llm grid generation — adapted from https://github.com/mxmarchal/pixel-llm (MIT).
 * Uses OpenRouter on the server (not browser WebGPU / Ministral).
 */

import type { ChatMessage } from '@/lib/npcChatter/openrouter';
import { getChatterCharacter } from '@/lib/chatterCast';
import { completeDrawingText } from './completeDrawing';
import type { EaselDrawingContext } from './drawingContext';
import type { DrawingProgram } from './types';
import type { GeneratedDrawing } from './generateDrawing';
import { buildRichFallbackProgram } from './fallbackSketches';
import { logEaselContext, logEaselDrawing } from './logDrawing';
import { npcPoolKey, paletteForNpc } from './drawingsPool';
import { totalSegments, validateProgram } from './segments';
import {
  buildAmbientGridUserPromptParts,
  buildGridSystemPrompt,
  buildGridUserPrompt,
} from './pixelLlm/prompt';
import { parsePixelGridResponse, validateGridPixels } from './pixelLlm/parseGrid';
import { gridToDrawingProgram, PIXEL_GRID_LOGICAL_SIZE } from './pixelLlm/gridToProgram';
import { resolveDrawSubject } from './resolveDrawSubject';

/** Sentinel — routes to pixel-llm GRID with default backend. */
export const PIXEL_LLM_GRID_MODEL = 'pixel-llm/grid';

/** Per-model ids: `pixel-llm/google/gemini-2.5-flash` */
export const PIXEL_LLM_PREFIX = 'pixel-llm/';

/** Default OpenRouter backend when no model suffix is given. */
export const PIXEL_LLM_BACKEND_MODEL = 'google/gemini-2.5-flash';

const MAX_ATTEMPTS = 2;
const GRID_SIZE = { width: PIXEL_GRID_LOGICAL_SIZE, height: PIXEL_GRID_LOGICAL_SIZE };

export function isPixelLlmGridModel(modelId: string): boolean {
  return modelId === PIXEL_LLM_GRID_MODEL || modelId.startsWith(PIXEL_LLM_PREFIX);
}

/** Extract OpenRouter model from `pixel-llm/<provider/model>`. */
export function resolvePixelLlmBackendModel(modelId: string): string {
  if (modelId.startsWith(PIXEL_LLM_PREFIX)) {
    const backend = modelId.slice(PIXEL_LLM_PREFIX.length);
    if (backend && backend !== 'grid') return backend;
  }
  return PIXEL_LLM_BACKEND_MODEL;
}

/** Every drawing uses pixel-llm GRID — wrap chat / raw OpenRouter ids when needed. */
export function ensurePixelLlmDrawingModel(modelId: string): string {
  const id = modelId.trim();
  if (!id) return `${PIXEL_LLM_PREFIX}${PIXEL_LLM_BACKEND_MODEL}`;
  if (isPixelLlmGridModel(id)) return id;
  return `${PIXEL_LLM_PREFIX}${id}`;
}

function backendModelLabel(backendModel: string): string {
  const slash = backendModel.lastIndexOf('/');
  return slash >= 0 ? backendModel.slice(slash + 1) : backendModel;
}

type GridAttemptResult =
  | { ok: true; program: DrawingProgram; pixels: number }
  | { ok: false; critique: string; raw: string | null };

async function attemptGridDrawing(
  backendModel: string,
  userPrompt: string,
  npcKey: string,
  topic: string,
  label: string,
  priorCritique: string | null,
  priorRaw: string | null,
): Promise<GridAttemptResult> {
  const systemPrompt = buildGridSystemPrompt(GRID_SIZE);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  if (priorCritique) {
    messages.push(
      { role: 'assistant', content: priorRaw?.trim() || '(invalid or empty grid)' },
      { role: 'user', content: priorCritique },
    );
  }

  const raw = await completeDrawingText(backendModel, messages);
  if (!raw) {
    return {
      ok: false,
      critique: 'Empty response. Return ONLY OFFSET + GRID — clear subject, K outline first.',
      raw: null,
    };
  }

  try {
    const pixels = parsePixelGridResponse(raw, GRID_SIZE);
    const validation = validateGridPixels(pixels, GRID_SIZE);
    if (!validation.ok) {
      return { ok: false, critique: validation.critique!, raw };
    }

    const program = gridToDrawingProgram(pixels, npcKey, topic, label);
    if (!program || !validateProgram(program)) {
      return {
        ok: false,
        critique: 'Grid parsed but too few strokes. Redraw with a bolder K silhouette and more fill pixels.',
        raw,
      };
    }

    return { ok: true, program, pixels: validation.pixelCount };
  } catch {
    return {
      ok: false,
      critique: 'Malformed grid. Use ONLY OFFSET/GRID lines with letters R G B Y O W K N and dots.',
      raw,
    };
  }
}

async function runGridGeneration(opts: {
  npcId: string;
  npcKey: string;
  backendModel: string;
  label: string;
  topic: string;
  userPrompt: string;
  logSource: string;
  logExtra?: Record<string, unknown>;
}): Promise<GeneratedDrawing | null> {
  let priorCritique: string | null = null;
  let priorRaw: string | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const hit = await attemptGridDrawing(
      opts.backendModel,
      opts.userPrompt,
      opts.npcKey,
      opts.topic,
      opts.label,
      priorCritique,
      priorRaw,
    );

    if (hit.ok) {
      void paletteForNpc(opts.npcKey);
      const total = totalSegments(hit.program);
      logEaselDrawing('server', opts.npcId, hit.program.topic, {
        source: opts.logSource,
        model: opts.backendModel,
        strokes: hit.program.strokes.length,
        segments: total,
        pixels: hit.pixels,
        attempt: attempt + 1,
        ...opts.logExtra,
      });
      return { program: hit.program, totalSegments: total };
    }

    priorCritique = hit.critique;
    priorRaw = hit.raw;
  }

  return null;
}

function fallbackProgram(npcId: string, userPrompt: string, backendModel: string): DrawingProgram {
  const npcKey = npcPoolKey(npcId);
  const ch = getChatterCharacter(npcId);
  const base = buildRichFallbackProgram({
    npcId,
    npcName: ch?.name ?? npcKey,
    modelId: backendModel,
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
    id: `pixel_fb_${npcKey}_${Date.now()}`,
    topic: userPrompt.slice(0, 48),
    model: `${backendModelLabel(backendModel)} grid`,
  };
}

/** Generate via pixel-llm GRID format → convert to easel strokes. */
export async function generatePixelGridDrawingProgram(
  npcId: string,
  userPrompt: string,
  opts?: { backendModel?: string },
): Promise<GeneratedDrawing> {
  const npcKey = npcPoolKey(npcId);
  const backendModel = opts?.backendModel ?? PIXEL_LLM_BACKEND_MODEL;
  const label = `${backendModelLabel(backendModel)} grid`;
  const drawSubject = await resolveDrawSubject(backendModel, { userPrompt });

  const hit = await runGridGeneration({
    npcId,
    npcKey,
    backendModel,
    label,
    topic: drawSubject,
    userPrompt: buildGridUserPrompt(drawSubject),
    logSource: 'pixel-llm-grid',
    logExtra: { prompt: userPrompt.slice(0, 80), subject: drawSubject },
  });
  if (hit) return hit;

  const program = fallbackProgram(npcId, drawSubject, backendModel);
  void paletteForNpc(npcKey);
  const total = totalSegments(program);
  logEaselDrawing('server', npcId, program.topic, {
    source: 'pixel-llm-fallback',
    model: backendModel,
    strokes: program.strokes.length,
    segments: total,
    prompt: userPrompt.slice(0, 80),
  });
  return { program, totalSegments: total };
}

/** Ambient easel drawing via pixel-llm GRID (stream/seed-driven subject). */
export async function generateAmbientPixelGridDrawingProgram(
  ctx: EaselDrawingContext,
): Promise<GeneratedDrawing> {
  logEaselContext(ctx);
  const npcKey = npcPoolKey(ctx.npcId);
  const backendModel = resolvePixelLlmBackendModel(ctx.modelId);
  const label = `${backendModelLabel(backendModel)} grid`;
  const drawSubject = await resolveDrawSubject(backendModel, {
    seedPrompt: ctx.seedPrompt,
    streamTitle: ctx.streamTitle,
    channelName: ctx.channelName,
    skyPeriod: ctx.skyPeriod,
    npcName: ctx.npcName,
    priorTopics: ctx.priorTopics,
  });
  const userPrompt = buildAmbientGridUserPromptParts(ctx, drawSubject);

  const hit = await runGridGeneration({
    npcId: ctx.npcId,
    npcKey,
    backendModel,
    label,
    topic: drawSubject,
    userPrompt,
    logSource: 'pixel-llm-ambient',
    logExtra: { subject: drawSubject, seed: ctx.seedPrompt?.slice(0, 80) },
  });
  if (hit) return hit;

  const base = buildRichFallbackProgram(ctx);
  const program = {
    ...base,
    id: `pixel_fb_${npcKey}_${Date.now()}`,
    model: `${backendModelLabel(backendModel)} grid`,
  };
  void paletteForNpc(npcKey);
  const total = totalSegments(program);
  logEaselDrawing('server', ctx.npcId, program.topic, {
    source: 'pixel-llm-ambient-fallback',
    model: backendModel,
    strokes: program.strokes.length,
    segments: total,
  });
  return { program, totalSegments: total };
}
