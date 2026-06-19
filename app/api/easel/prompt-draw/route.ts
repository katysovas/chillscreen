import { NextResponse } from 'next/server';
import { generatePromptedDrawingProgram } from '@/lib/easel/generatePromptedDrawing';
import {
  drawingModelLabel,
  ensurePixelLlmDrawingModel,
  resolveDrawingModelId,
} from '@/lib/easel/drawingModel';
import { parseDrawPrompt } from '@/lib/easel/parseDrawPrompt';
import { ierror } from '@/lib/internalDebug';

type RequestBody = {
  npcId?: string;
  prompt?: string;
  message?: string;
  /** Optional drawing model override (test / admin). */
  modelId?: string;
};

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const npcId = body.npcId?.trim();
  if (!npcId) {
    return NextResponse.json({ ok: false, error: 'npcId is required' }, { status: 400 });
  }

  const userPrompt = body.prompt?.trim()
    || (body.message ? parseDrawPrompt(body.message) : null);
  if (!userPrompt) {
    return NextResponse.json({ ok: false, error: 'prompt is required' }, { status: 400 });
  }

  try {
    const modelId = ensurePixelLlmDrawingModel(body.modelId?.trim() || resolveDrawingModelId(npcId));
    const { program, totalSegments } = await generatePromptedDrawingProgram(
      npcId,
      userPrompt,
      { modelId },
    );
    return NextResponse.json({
      ok: true,
      program,
      totalSegments,
      topic: program.topic,
      drawingId: program.id,
      modelId,
      modelLabel: drawingModelLabel(modelId),
    });
  } catch (err) {
    ierror('[easel:prompt-draw] failed', npcId, err);
    return NextResponse.json({ ok: false, error: 'generation failed' }, { status: 500 });
  }
}
