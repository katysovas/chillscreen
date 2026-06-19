import {
  EASEL_DISPLAY_WIDTH,
  EASEL_FRAME_LEFT_SCALED,
  EASEL_NPC_STAND_GAP,
  EASEL_NPC_STAND_REACH_PX,
} from './layout';

/** Canvas center world-x when the NPC stands to its left, facing right. */
export function npcPromptCanvasWorldX(npcWorldX: number): number {
  const canvasLeft = npcWorldX + EASEL_NPC_STAND_REACH_PX + EASEL_NPC_STAND_GAP;
  return canvasLeft - EASEL_FRAME_LEFT_SCALED + EASEL_DISPLAY_WIDTH / 2;
}
