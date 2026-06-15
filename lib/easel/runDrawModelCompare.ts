'use client';

import { getCharacterById } from '@/lib/npcChat';
import type { CharacterDef } from '@/components/game/characters';
import {
  TEST_DRAW_MODEL_COMPARE,
  TEST_DRAW_MODEL_COMPARE_CONFIG,
  drawingModelLabel,
} from '@/lib/easel/drawingModel';
import { screenPctToWorldX } from '@/lib/gameWorldRef';
import { fetchPromptDraw } from '@/lib/easel/chatNpcDrawings';
import { npcPromptCanvasWorldX } from '@/lib/easel/npcPromptLayout';
import type { ChatNpcDrawingSession } from '@/lib/easel/types';
import { iwarn } from '@/lib/internalDebug';

export type CompareDrawPin = {
  npcId: string;
  canvasWorldX: number;
  topic: string;
  modelLabel: string;
};

/** Cast for side-by-side draw model compare — NPCs pinned on screen. */
export function drawModelCompareCast(): CharacterDef[] | null {
  if (!TEST_DRAW_MODEL_COMPARE) return null;

  const cast: CharacterDef[] = [];
  for (let i = 0; i < TEST_DRAW_MODEL_COMPARE_CONFIG.npcIds.length; i++) {
    const id = TEST_DRAW_MODEL_COMPARE_CONFIG.npcIds[i]!;
    const ch = getCharacterById(id);
    if (!ch) continue;
    cast.push({
      ...ch,
      startX: TEST_DRAW_MODEL_COMPARE_CONFIG.screenPct[i]!,
      entryDelay: 0,
      entryDirection: 'right',
    });
  }
  return cast.length > 0 ? cast : null;
}

/** Pin positions + labels before the LLM returns stroke programs. */
export function buildCompareDrawPins(
  worldOff: number,
  viewportWidth: number,
): CompareDrawPin[] {
  const { npcIds, models, prompt, screenPct } = TEST_DRAW_MODEL_COMPARE_CONFIG;
  return npcIds.map((npcId, i) => {
    const npcWorldX = screenPctToWorldX(screenPct[i]!, worldOff, viewportWidth);
    return {
      npcId,
      canvasWorldX: npcPromptCanvasWorldX(npcWorldX),
      topic: prompt,
      modelLabel: drawingModelLabel(models[i]!),
    };
  });
}

/** Fire one fetch per model; call onSession as each finishes (don't wait for slowest). */
export async function runDrawModelCompare(
  worldOff: number,
  viewportWidth: number,
  onSession?: (session: ChatNpcDrawingSession) => void,
): Promise<ChatNpcDrawingSession[]> {
  const { npcIds, models, prompt, screenPct } = TEST_DRAW_MODEL_COMPARE_CONFIG;
  const results: ChatNpcDrawingSession[] = [];

  await Promise.all(
    npcIds.map(async (npcId, i) => {
      const npcWorldX = screenPctToWorldX(screenPct[i]!, worldOff, viewportWidth);
      const modelId = models[i]!;
      const hit = await fetchPromptDraw({
        npcId,
        prompt,
        npcWorldX,
        modelId,
      });
      if (!hit) {
        iwarn('[draw-compare] generation failed for', npcId, modelId);
        return;
      }
      const session: ChatNpcDrawingSession = {
        ...hit,
        status: 'painting',
        isCompareTest: true,
        modelLabel: hit.modelLabel ?? drawingModelLabel(modelId),
      };
      results.push(session);
      onSession?.(session);
    }),
  );

  return results;
}
