import { easelNpcStandWorldX, easelSlotWorldX } from './layout';
import type { EaselSessionSync } from './types';

/** Ground stand position — NPC teleports here when assigned as painter. */
export function easelStationWorldXForNpc(
  npcId: string,
  session: EaselSessionSync | null,
  stageSlug: string,
  width?: number,
): number | undefined {
  if (!session) return undefined;
  const slot = session.slots.find(s => s.npc === npcId && s.status === 'painting');
  if (!slot) return undefined;
  return easelNpcStandWorldX(slot.slot, stageSlug, width);
}

/** @deprecated use easelStationWorldXForNpc */
export const easelWalkTargetWorldXForNpc = easelStationWorldXForNpc;

/** NPCs actively painting — finished painters are released to wander. */
export function stationedNpcIds(session: EaselSessionSync | null): Set<string> {
  if (!session) return new Set();
  return new Set(session.slots.filter(s => s.status === 'painting').map(s => s.npc));
}

export { easelSlotWorldX, easelNpcStandWorldX };
