import { ensurePixelLlmDrawingModel, resolveDrawingModelId } from './drawingModel';
import {
  generatePixelGridDrawingProgram,
  resolvePixelLlmBackendModel,
} from './generatePixelGridDrawing';
import type { GeneratedDrawing } from './generateDrawing';

/** Generate a drawing driven only by the player's chat prompt — always pixel-llm GRID. */
export async function generatePromptedDrawingProgram(
  npcId: string,
  userPrompt: string,
  opts?: { modelId?: string },
): Promise<GeneratedDrawing> {
  const modelId = ensurePixelLlmDrawingModel(opts?.modelId ?? resolveDrawingModelId(npcId));
  return generatePixelGridDrawingProgram(npcId, userPrompt, {
    backendModel: resolvePixelLlmBackendModel(modelId),
  });
}
