import { EASEL_DISPLAY_WIDTH } from './layout';

export type EaselCanvasBlockZone = {
  canvasWorldX: number;
  painterNpcId: string;
  minX: number;
  maxX: number;
};

let activeZone: EaselCanvasBlockZone | null = null;

/** Ground-x band where idle NPCs must not stand in front of an active canvas. */
export function easelCanvasBlockBand(canvasWorldX: number): { minX: number; maxX: number } {
  const halfCanvas = EASEL_DISPLAY_WIDTH / 2;
  return {
    minX: canvasWorldX - 55 - 72,
    maxX: canvasWorldX + halfCanvas + 52,
  };
}

export function setActiveEaselCanvasBlockZone(
  zone: { canvasWorldX: number; painterNpcId: string } | null,
): void {
  if (!zone) {
    activeZone = null;
    return;
  }
  const band = easelCanvasBlockBand(zone.canvasWorldX);
  activeZone = { ...zone, ...band };
}

export function getActiveEaselCanvasBlockZone(): EaselCanvasBlockZone | null {
  return activeZone;
}

export function worldXBlocksEaselCanvas(worldX: number): boolean {
  if (!activeZone) return false;
  return worldX >= activeZone.minX && worldX <= activeZone.maxX;
}

/** Step outside the block band — prefers the nearer side. */
export function pickWorldXOutsideEaselBlock(curWorldX: number): number {
  if (!activeZone) return curWorldX;
  const { minX, maxX } = activeZone;
  const distLeft = curWorldX - minX;
  const distRight = maxX - curWorldX;
  const margin = 48 + Math.random() * 36;
  return distLeft <= distRight ? minX - margin : maxX + margin;
}

export function shouldNpcAvoidEaselCanvas(npcId: string): boolean {
  if (!activeZone) return false;
  return activeZone.painterNpcId !== npcId;
}
