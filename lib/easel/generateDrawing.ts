import type { EaselDrawingContext } from './drawingContext';
import { ensurePixelLlmDrawingModel, generateAmbientPixelGridDrawingProgram } from './generatePixelGridDrawing';
import type { DrawingProgram } from './types';

export type GeneratedDrawing = {
  program: DrawingProgram;
  totalSegments: number;
};

/** Ambient easel drawing — always pixel-llm GRID. */
export async function generateDrawingProgram(ctx: EaselDrawingContext): Promise<GeneratedDrawing> {
  return generateAmbientPixelGridDrawingProgram({
    ...ctx,
    modelId: ensurePixelLlmDrawingModel(ctx.modelId),
  });
}
