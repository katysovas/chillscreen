import { EASEL_DISPLAY_WIDTH, EASEL_NPC_BODY_PX, EASEL_NPC_STAND_GAP } from './layout';

/** Canvas center world-x when the NPC stands to its left, facing right. */
export function npcPromptCanvasWorldX(npcWorldX: number): number {
  const frameLeft = npcWorldX + EASEL_NPC_BODY_PX + EASEL_NPC_STAND_GAP;
  return frameLeft + EASEL_DISPLAY_WIDTH / 2;
}
