/**
 * Drawing LLM selection — separate from NPC chat models.
 *
 * All NPC drawings (ambient easels + chat prompts) use the pixel-llm GRID
 * pipeline. Chat replies still use each NPC's own model.
 *
 * Set `DRAWING_MODEL_OVERRIDE` to force one pixel-llm backend for every NPC.
 * null = each NPC draws via pixel-llm/{their chat model}.
 *
 * Enable `TEST_DRAW_MODEL_COMPARE` to spawn NPCs on load, same prompt,
 * different models — side-by-side canvases for judging.
 */

import { resolveNpcModelId, getChatterCharacter } from '@/lib/chatterCast';
import {
  ensurePixelLlmDrawingModel,
  isPixelLlmGridModel,
  resolvePixelLlmBackendModel,
} from './generatePixelGridDrawing';

/** Default pixel-llm backend when no per-NPC chat model is available. */
export const DEFAULT_DRAWING_MODEL = 'pixel-llm/google/gemini-2.5-flash';

/** Force this pixel-llm backend for all drawing. null = per-NPC chat model. */
export const DRAWING_MODEL_OVERRIDE: string | null = DEFAULT_DRAWING_MODEL;

/** Side-by-side drawing model shootout on page load. */
export const TEST_DRAW_MODEL_COMPARE = false;

/** Mid-tier OpenRouter models — capable but not flagship pricing. */
export const TEST_DRAW_MODEL_COMPARE_CONFIG = {
  prompt: 'cat',
  /** Wandering cast ids — must exist in characters / generated roster. */
  npcIds: ['luna', 'mochi', 'dub', 'ziggy'],
  /** Ground screen % — spread four painters across the street. */
  screenPct: [18, 38, 58, 78],
  models: [
    'pixel-llm/google/gemini-2.5-flash',
    'pixel-llm/anthropic/claude-3.5-haiku',
    'pixel-llm/meta-llama/llama-3.3-70b-instruct',
    'pixel-llm/openai/gpt-4.1-mini',
  ],
};

export function drawModelCompareConfigKey(): string {
  const { prompt, npcIds, models } = TEST_DRAW_MODEL_COMPARE_CONFIG;
  return `${prompt}\0${npcIds.join(',')}\0${models.join(',')}`;
}

export function drawingModelLabel(modelId: string): string {
  if (isPixelLlmGridModel(modelId)) {
    const backend = resolvePixelLlmBackendModel(modelId);
    const slash = backend.lastIndexOf('/');
    const name = slash >= 0 ? backend.slice(slash + 1) : backend;
    return `${name} grid`;
  }
  const slash = modelId.lastIndexOf('/');
  return slash >= 0 ? modelId.slice(slash + 1) : modelId;
}

/** Pixel-llm GRID model for stroke generation — not NPC chat. */
export function resolveDrawingModelId(npcId: string): string {
  if (TEST_DRAW_MODEL_COMPARE) {
    const idx = TEST_DRAW_MODEL_COMPARE_CONFIG.npcIds.indexOf(npcId);
    if (idx >= 0) {
      return ensurePixelLlmDrawingModel(TEST_DRAW_MODEL_COMPARE_CONFIG.models[idx]!);
    }
  }

  if (DRAWING_MODEL_OVERRIDE) {
    return ensurePixelLlmDrawingModel(DRAWING_MODEL_OVERRIDE);
  }

  const ch = getChatterCharacter(npcId);
  const chatModel = ch ? resolveNpcModelId(ch) : 'openai/gpt-4.1-nano';
  return ensurePixelLlmDrawingModel(chatModel);
}

export function isDrawModelCompareNpc(npcId: string): boolean {
  if (!TEST_DRAW_MODEL_COMPARE) return false;
  return TEST_DRAW_MODEL_COMPARE_CONFIG.npcIds.includes(npcId);
}

export function drawModelCompareNpcIds(): readonly string[] {
  return TEST_DRAW_MODEL_COMPARE ? TEST_DRAW_MODEL_COMPARE_CONFIG.npcIds : [];
}

export { ensurePixelLlmDrawingModel };
