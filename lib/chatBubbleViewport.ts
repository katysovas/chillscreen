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

/** Product of ancestor `transform` scaleX up to (but excluding) `game-surface`. */
export function parentTransformScaleX(el: HTMLElement): number {
  let scale = 1;
  let node: HTMLElement | null = el.parentElement;
  while (node && !node.classList.contains('game-surface')) {
    const t = getComputedStyle(node).transform;
    if (t && t !== 'none') {
      scale *= new DOMMatrixReadOnly(t).a;
    }
    node = node.parentElement;
  }
  return Math.abs(scale) || 1;
}

/** Bounds of visible chat bubbles inside an anchor (more accurate than the anchor box). */
export function measureChatOverlayRect(el: HTMLElement): DOMRect {
  const nodes = el.querySelectorAll('.game-chat-bubble, .game-chat-input-bubble');
  if (nodes.length === 0) return el.getBoundingClientRect();

  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  nodes.forEach(node => {
    const r = node.getBoundingClientRect();
    if (r.width <= 0 && r.height <= 0) return;
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
  });

  if (!Number.isFinite(left)) return el.getBoundingClientRect();
  return new DOMRect(left, top, right - left, bottom - top);
}

/**
 * Shift a character-attached chat anchor so bubble contents stay inside the viewport.
 * Uses scale-aware margin (sprites are scaled down in world space).
 */
export function clampChatAnchorHorizontally(
  el: HTMLElement,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
  pad = CHAT_BUBBLE_EDGE_PAD_PX,
): number {
  const scale = parentTransformScaleX(el);
  let marginLocal = 0;

  for (let pass = 0; pass < 4; pass++) {
    el.style.marginLeft = `${marginLocal}px`;
    const rect = measureChatOverlayRect(el);
    let deltaScreen = 0;
    if (rect.right > viewportWidth - pad) deltaScreen += viewportWidth - pad - rect.right;
    if (rect.left + deltaScreen < pad) deltaScreen += pad - (rect.left + deltaScreen);
    if (Math.abs(deltaScreen) < 0.5) break;
    marginLocal += deltaScreen / scale;
  }

  el.style.marginLeft = `${Math.round(marginLocal)}px`;
  return marginLocal;
}

/** Bubble sits above the character's left or right side — flip inward near edges. */
export function screenXToBubbleSide(screenX: number): BubbleSide {
  if (screenX < 28) return 'right';
  if (screenX > 72) return 'left';
  return screenX < 50 ? 'left' : 'right';
}

/** Player bubble on the side away from the partner, but stay on-screen. */
export function playerBubbleSide(npcScreenX: number): BubbleSide {
  if (npcScreenX < 28) return 'right';
  if (npcScreenX > 72) return 'left';
  return npcScreenX >= 50 ? 'left' : 'right';
}
