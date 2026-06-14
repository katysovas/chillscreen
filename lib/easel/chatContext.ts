import { programForSlot } from './resolveProgram';
import type { EaselSessionSync } from './types';

/** Serializable easel state for 1:1 NPC chat prompts. */
export type EaselPaintingChatContext = {
  topic: string;
  status: 'painting';
  progressPct: number;
};

export function easelPaintingContextForNpc(
  npcId: string,
  session: EaselSessionSync | null,
): EaselPaintingChatContext | null {
  if (!session) return null;
  const slot = session.slots.find(s => s.npc === npcId && s.status === 'painting');
  if (!slot) return null;

  const program = programForSlot(slot);
  const topic = slot.topic?.trim() || program?.topic?.trim();
  if (!topic) return null;

  const total = slot.total_segments > 0 ? slot.total_segments : 1;
  const done = Math.min(slot.segments_done, total);
  const progressPct = Math.round((done / total) * 100);

  return {
    topic,
    status: 'painting',
    progressPct,
  };
}

export function easelPaintingWorldNote(
  ctx: EaselPaintingChatContext | null | undefined,
): string {
  if (!ctx) return '';

  const progress =
    ctx.progressPct >= 95
      ? 'almost finished'
      : ctx.progressPct >= 50
        ? 'about halfway done'
        : ctx.progressPct >= 15
          ? 'just getting started'
          : 'still sketching the first lines';

  return `Right now you are at the street easel actively painting "${ctx.topic}" (${progress}, ~${ctx.progressPct}% complete). You chose this subject — you know what you're trying to capture. If the player asks about your drawing, the easel, or what you're making, answer in your voice: mention the subject, your mood, why you picked it, or what's still left to do. Keep painting while you talk — you're not walking away from the canvas.`;
}
