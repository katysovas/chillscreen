'use client';

import type { ChatNpcDrawingSession, DrawingProgram } from './types';
import { EASEL_DEFAULT_RATE } from './types';
import { chatDrawingExpiresAt } from './lifecycle';
import { npcPromptCanvasWorldX } from './npcPromptLayout';
import { iwarn } from '@/lib/internalDebug';

export type PromptDrawRequest = {
  npcId: string;
  prompt: string;
  npcWorldX: number;
  /** Override drawing LLM — chat model is ignored when set. */
  modelId?: string;
};

export async function fetchPromptDraw(
  req: PromptDrawRequest,
): Promise<Omit<ChatNpcDrawingSession, 'status'> | null> {
  try {
    const res = await fetch('/api/easel/prompt-draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        npcId: req.npcId,
        prompt: req.prompt,
        modelId: req.modelId,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      iwarn('[easel:prompt-draw] client fetch failed', res.status, detail.slice(0, 200));
      return null;
    }
    const data = await res.json() as {
      ok?: boolean;
      program?: DrawingProgram;
      totalSegments?: number;
      topic?: string;
      drawingId?: string;
      modelId?: string;
      modelLabel?: string;
    };
    if (!data.ok || !data.program || data.totalSegments == null) return null;

    const sessionStart = Date.now();
    return {
      id: data.drawingId ?? data.program.id,
      npcId: req.npcId,
      topic: data.topic ?? data.program.topic,
      program: data.program,
      totalSegments: data.totalSegments,
      canvasWorldX: npcPromptCanvasWorldX(req.npcWorldX),
      sessionStart,
      expiresAt: chatDrawingExpiresAt(sessionStart),
      modelId: data.modelId,
      modelLabel: data.modelLabel,
    };
  } catch {
    return null;
  }
}

export function chatDrawingRate(): number {
  return EASEL_DEFAULT_RATE;
}

export function pruneExpiredChatDrawings(
  sessions: ChatNpcDrawingSession[],
  now = Date.now(),
): ChatNpcDrawingSession[] {
  return sessions.filter(s => s.expiresAt > now);
}

export function activeChatDrawingForNpc(
  sessions: ChatNpcDrawingSession[],
  npcId: string,
): ChatNpcDrawingSession | null {
  const now = Date.now();
  return sessions.find(s => s.npcId === npcId && s.expiresAt > now) ?? null;
}
