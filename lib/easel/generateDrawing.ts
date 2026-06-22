import type { EaselDrawingContext } from './drawingContext';
import { stageUsesDoodleManifest } from './doodle/manifest';
import { tryGenerateManifestDoodle } from './doodle/program';
import { buildRichFallbackProgram } from './fallbackSketches';
import { ensurePixelLlmDrawingModel, generateAmbientPixelGridDrawingProgram } from './generatePixelGridDrawing';
import { normalizeEaselStage } from './stageKey';
import { totalSegments } from './segments';
import type { EaselArtProgram } from './types';

export type GeneratedDrawing = {
  program: EaselArtProgram;
  totalSegments: number;
};

/** Ambient easel drawing — curated doodle sprite when manifest has one, else pixel-llm GRID. */
export async function generateDrawingProgram(
  ctx: EaselDrawingContext,
  stageSlug: string,
): Promise<GeneratedDrawing> {
  const stageKey = normalizeEaselStage(stageSlug);
  const doodle = await tryGenerateManifestDoodle(ctx, stageKey);
  if (doodle) return doodle;

  if (stageUsesDoodleManifest(stageKey)) {
    const program = buildRichFallbackProgram(ctx);
    return {
      program: {
        ...program,
        id: `fallback_${ctx.npcId}_${Date.now()}`,
        topic: program.topic || 'sketch',
      },
      totalSegments: totalSegments(program),
    };
  }

  return generateAmbientPixelGridDrawingProgram({
    ...ctx,
    modelId: ensurePixelLlmDrawingModel(ctx.modelId),
  });
}
