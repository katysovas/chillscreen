import {
  EASEL_DISPLAY_WIDTH,
  EASEL_NPC_HALF_WIDTH_PX,
  easelNpcStandWorldXForCanvas,
} from './layout';

export type EaselCanvasBlockZone = {
  canvasWorldX: number;
  painterNpcId: string;
  minX: number;
  maxX: number;
};

let activeZones: EaselCanvasBlockZone[] = [];

/** Ground-x band where idle NPCs must not stand in front of an active canvas. */
export function easelCanvasBlockBand(canvasWorldX: number): { minX: number; maxX: number } {
  const halfCanvas = EASEL_DISPLAY_WIDTH / 2;
  const standX = easelNpcStandWorldXForCanvas(canvasWorldX);
  return {
    minX: standX - EASEL_NPC_HALF_WIDTH_PX * 0.35,
    maxX: canvasWorldX + halfCanvas + 52,
  };
}

export function setActiveEaselCanvasBlockZones(
  zones: { canvasWorldX: number; painterNpcId: string }[],
): void {
  activeZones = zones.map(zone => {
    const band = easelCanvasBlockBand(zone.canvasWorldX);
    return { ...zone, ...band };
  });
}

/** @deprecated Use setActiveEaselCanvasBlockZones. */
export function setActiveEaselCanvasBlockZone(
  zone: { canvasWorldX: number; painterNpcId: string } | null,
): void {
  setActiveEaselCanvasBlockZones(zone ? [zone] : []);
}

export function getActiveEaselCanvasBlockZones(): EaselCanvasBlockZone[] {
  return activeZones;
}

export function worldXBlocksEaselCanvas(worldX: number): boolean {
  return activeZones.some(z => worldX >= z.minX && worldX <= z.maxX);
}

/** Step outside the nearest overlapping block band. */
export function pickWorldXOutsideEaselBlock(curWorldX: number): number {
  const overlapping = activeZones.filter(z => curWorldX >= z.minX && curWorldX <= z.maxX);
  if (overlapping.length === 0) return curWorldX;

  const zone = overlapping[0]!;
  const distLeft = curWorldX - zone.minX;
  const distRight = zone.maxX - curWorldX;
  const margin = 48 + Math.random() * 36;
  return distLeft <= distRight ? zone.minX - margin : zone.maxX + margin;
}

export function shouldNpcAvoidEaselCanvas(npcId: string): boolean {
  return activeZones.some(z => z.painterNpcId !== npcId);
}
