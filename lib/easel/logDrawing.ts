import { isChatterDebugActive } from '@/lib/chatterDebug';
import type { EaselDrawingContext } from './drawingContext';

export function logEaselDrawing(
  where: 'server' | 'client',
  npcId: string,
  topic: string,
  extra: Record<string, string | number | boolean | null | undefined> = {},
): void {
  if (!isChatterDebugActive()) return;

  const name = npcId.split('-').pop() ?? npcId;
  const bits = Object.entries(extra)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  console.log(
    `[easel:${where}] ${name} (${npcId}) → "${topic}"${bits ? ` — ${bits}` : ''}`,
  );
}

export function logEaselContext(ctx: EaselDrawingContext): void {
  if (!isChatterDebugActive()) return;

  console.log('[easel:server] drawing context', {
    npc: ctx.npcName,
    npcId: ctx.npcId,
    model: ctx.modelId,
    vibe: ctx.vibe,
    sky: ctx.skyPeriod,
    stream: ctx.streamTitle,
    seedKind: ctx.seedKind,
    seed: ctx.seedPrompt,
    priorTopics: ctx.priorTopics.length,
  });
}
