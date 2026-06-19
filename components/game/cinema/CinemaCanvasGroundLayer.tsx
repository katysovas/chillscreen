'use client';

import { memo, useEffect, useRef } from 'react';
import { CHAR_BOTTOM } from '@/components/game/groundLayout';
import { worldXToScreenPct } from '@/components/game/NPC';
import { Z_EASEL } from '@/lib/zLayers';
import { cinemaCanvasAnchorWorldX } from '@/lib/cinemaCanvasLayout';
import { setWorldPositionTick } from '@/lib/worldPositionTicks';
import { CinemaCanvasEasel } from './CinemaCanvasEasel';
import { useCinemaCanvas } from './CinemaCanvasContext';

const OFFSCREEN_LEFT = -22;
const OFFSCREEN_RIGHT = 122;

/**
 * Ground-layer easel — identical pattern to NPC:
 *  - worldX is fixed at mount, never changes
 *  - left% = worldXToScreenPct(worldX, off, width) set every game-loop frame
 *  - React JSX has NO `left`, NO `visibility`, NO `pointerEvents` — game loop owns all three
 *  - starts at left:'-300%' (off-screen) so no flash before first tick
 */
export const CinemaCanvasGroundLayer = memo(function CinemaCanvasGroundLayer() {
  const { active, interactive } = useCinemaCanvas();
  const outerRef = useRef<HTMLDivElement>(null);
  const worldXRef = useRef<number | null>(null);
  const onScreenRef = useRef(false);
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;

  // Compute worldX once — ground coords, same space as NPCs
  useEffect(() => {
    worldXRef.current = cinemaCanvasAnchorWorldX();
  }, []);

  useEffect(() => {
    if (!active) return;
    return setWorldPositionTick((off, width) => {
      const el = outerRef.current;
      const worldX = worldXRef.current;
      if (!el || worldX == null) return;

      const pct = worldXToScreenPct(worldX, off, width);
      // Use transform (compositor-only) instead of `left` — no layout recalc,
      // no repaint of neighboring elements (e.g. cinema iframe).
      const px = Math.round((pct / 100) * width);
      el.style.transform = `translateX(${px}px) translateX(-50%)`;

      const onScreen = pct >= OFFSCREEN_LEFT && pct <= OFFSCREEN_RIGHT;
      if (onScreen !== onScreenRef.current) {
        onScreenRef.current = onScreen;
        el.style.visibility = onScreen ? 'visible' : 'hidden';
        el.style.pointerEvents = onScreen && interactiveRef.current ? 'auto' : 'none';
      }
    });
  }, [active]);

  if (!active) return null;

  return (
    // outerRef: transform owned by game loop, left=0 is static (no reflow each frame)
    <div
      ref={outerRef}
      data-cinema-canvas-layer
      style={{
        position: 'absolute',
        left: 0,
        bottom: CHAR_BOTTOM,
        zIndex: Z_EASEL,
        willChange: 'transform',
      }}
    >
      <CinemaCanvasEasel interactive={interactive} />
    </div>
  );
});
