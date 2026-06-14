import { modelLabelForNpc, npcPoolKey } from './drawingsPool';
import { programForSlot } from './resolveProgram';
import type { EaselSessionSync, EaselSlotSync } from './types';

/** Human-readable subject line for an easel slot. */
export function easelPaintingLabelForSlot(slot: EaselSlotSync): string {
  const npcKey = npcPoolKey(slot.npc);
  const model = modelLabelForNpc(npcKey);
  const name = slot.npc.split('-').pop() ?? slot.npc;
  return slot.topic?.trim() || programForSlot(slot)?.topic || `${model} ${name}`;
}

/** Label for the NPC actively painting — null once their canvas is finished. */
export function easelPaintingLabelForNpc(
  npcId: string,
  session: EaselSessionSync | null,
): string | null {
  if (!session) return null;
  const slot = session.slots.find(s => s.npc === npcId && s.status === 'painting');
  if (!slot) return null;
  return easelPaintingLabelForSlot(slot);
}
