'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { CHAR_BOTTOM } from '@/components/game/groundLayout';
import { worldXToScreenPct } from '@/components/game/NPC';
import { preloadDoodleSprite } from '@/lib/easel/doodle/preloadSprite';
import { isDoodleSpriteProgram } from '@/lib/easel/doodle/program';
import { resolveSlotArt } from '@/lib/easel/doodle/resolveSlotArt';
import { easelSlotWorldX } from '@/lib/easel/layout';
import { useEaselPainterReady } from '@/lib/easel/painterReadyRegistry';
import type { EaselSessionSync, EaselSlotSync } from '@/lib/easel/types';
import { pickVisibleEaselSlots } from '@/lib/easel/visibleSlots';
import { Z_EASEL } from '@/lib/zLayers';
import type { VenueRoute } from '@/lib/venueSlugs';
import { venueSlugForRoute } from '@/lib/venueSlugs';
import { setWorldPositionTick } from '@/lib/worldPositionTicks';
import { EaselSlotView } from './EaselSlotView';

const OFFSCREEN_LEFT = -22;
const OFFSCREEN_RIGHT = 122;

type Props = {
  active: boolean;
  stageSlug: string;
  /** Venue template for slot positions when `stageSlug` is a creator stage id. */
  layoutRoute?: VenueRoute;
  session: EaselSessionSync | null;
};

function EaselSlotLayer({
  slot,
  sessionStart,
  stageSlug,
  layoutRoute,
}: {
  slot: EaselSlotSync;
  sessionStart: number;
  stageSlug: string;
  layoutRoute?: VenueRoute;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const onScreenRef = useRef(false);
  const [onScreenPaused, setOnScreenPaused] = useState(true);
  const painting = slot.status === 'painting';
  const painterReady = useEaselPainterReady(slot.npc, painting);

  useEffect(() => {
    if (!painterReady) return;
    return setWorldPositionTick((off, width) => {
      const el = outerRef.current;
      if (!el) return;

      const worldX = easelSlotWorldX(slot.slot, stageSlug, width, layoutRoute, off);
      const pct = worldXToScreenPct(worldX, off, width);
      const px = Math.round((pct / 100) * width);
      el.style.transform = `translateX(${px}px) translateX(-50%)`;

      const onScreen = pct >= OFFSCREEN_LEFT && pct <= OFFSCREEN_RIGHT;
      if (onScreen !== onScreenRef.current) {
        onScreenRef.current = onScreen;
        el.style.visibility = onScreen ? 'visible' : 'hidden';
        setOnScreenPaused(!onScreen);
      }
    });
  }, [painterReady, slot.slot, stageSlug, layoutRoute]);

  if (painting && !painterReady) return null;

  return (
    <div
      ref={outerRef}
      data-cinema-canvas-layer
      style={{
        position: 'absolute',
        left: 0,
        bottom: CHAR_BOTTOM,
        zIndex: Z_EASEL,
        willChange: 'transform',
        visibility: 'hidden',
      }}
    >
      <EaselSlotView
        stageSlug={stageSlug}
        layoutRoute={layoutRoute}
        slot={slot}
        sessionStart={sessionStart}
        paused={onScreenPaused}
        painterReady={painterReady}
      />
    </div>
  );
}

/** Ambient stage easels — one unprompted painter; user prompts are unlimited via chat. */
export const StageEaselsLayer = memo(function StageEaselsLayer({
  active,
  stageSlug,
  layoutRoute,
  session,
}: Props) {
  const visibleSlots = useMemo(
    () => (session ? pickVisibleEaselSlots(session.slots) : []),
    [session],
  );
  const sessionStart = session?.sessionStart ?? 0;

  useEffect(() => {
    if (!active || visibleSlots.length === 0) return;
    for (const slot of visibleSlots) {
      const resolved = resolveSlotArt(stageSlug, slot, layoutRoute);
      if (resolved && isDoodleSpriteProgram(resolved.art)) {
        void preloadDoodleSprite(resolved.art.spritePath);
      }
    }
  }, [active, visibleSlots, stageSlug, layoutRoute]);

  if (!active || visibleSlots.length === 0) return null;

  return (
    <>
      {visibleSlots.map(slot => (
        <EaselSlotLayer
          key={slot.slot}
          slot={slot}
          sessionStart={sessionStart}
          stageSlug={stageSlug}
          layoutRoute={layoutRoute}
        />
      ))}
    </>
  );
});

export function stageSlugFromVenueRoute(route: string): string {
  return venueSlugForRoute(route as VenueRoute);
}
