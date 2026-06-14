import type { BubbleSide } from '@/components/game/ChatBubble';

/** Horizontal inset so chat columns never touch the screen edge. */
export const CHAT_BUBBLE_EDGE_PAD_PX = 16;

export function isNarrowChatViewport(viewportWidth: number): boolean {
  return viewportWidth <= 767;
}

/** Max width for a centered chat column (pair convo, player thread). */
export function chatColumnMaxWidthPx(viewportWidth: number): number {
  return Math.min(320, viewportWidth - CHAT_BUBBLE_EDGE_PAD_PX * 2);
}

/** Keep overlay center so the full column fits inside the viewport. */
export function clampOverlayCenterPx(
  centerPx: number,
  overlayWidthPx: number,
  viewportWidth: number,
  pad = CHAT_BUBBLE_EDGE_PAD_PX,
): number {
  const half = Math.max(overlayWidthPx / 2, 1);
  const min = pad + half;
  const max = viewportWidth - pad - half;
  if (min > max) return viewportWidth / 2;
  return Math.min(max, Math.max(min, centerPx));
}

/** Bubble sits above the character's left or right side — flip inward near edges. */
export function screenXToBubbleSide(screenX: number): BubbleSide {
  if (screenX < 24) return 'right';
  if (screenX > 76) return 'left';
  return screenX < 50 ? 'left' : 'right';
}

/** Player bubble on the side away from the partner, but stay on-screen. */
export function playerBubbleSide(npcScreenX: number): BubbleSide {
  if (npcScreenX < 24) return 'right';
  if (npcScreenX > 76) return 'left';
  return npcScreenX >= 50 ? 'left' : 'right';
}
