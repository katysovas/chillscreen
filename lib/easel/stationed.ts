import { easelNpcStandWorldX, easelSlotWorldX } from './layout';
import type { EaselSessionSync } from './types';

/** Map NPC character id → ground stand target beside its easel (walk, then pin). */
export function easelWalkTargetWorldXForNpc(
  npcId: string,
  session: EaselSessionSync | null,
  stageSlug: string,
  width?: number,
): number | undefined {
  if (!session) return undefined;
  const slot = session.slots.find(s => s.npc === npcId);
  if (!slot) return undefined;
  return easelNpcStandWorldX(slot.slot, stageSlug, width);
}

/** @deprecated use easelWalkTargetWorldXForNpc */
export const easelStationWorldXForNpc = easelWalkTargetWorldXForNpc;

export function stationedNpcIds(session: EaselSessionSync | null): Set<string> {
  if (!session) return new Set();
  return new Set(session.slots.map(s => s.npc));
}

export { easelSlotWorldX, easelNpcStandWorldX };
