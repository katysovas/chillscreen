'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { CHAR_BOTTOM } from '@/components/game/groundLayout';
import { worldXToScreenPct } from '@/components/game/NPC';
import { easelSlotWorldX } from '@/lib/easel/layout';
import { useEaselPainterReady } from '@/lib/easel/painterReadyRegistry';
import type { EaselSessionSync, EaselSlotSync } from '@/lib/easel/types';
import { pickVisibleEaselSlots } from '@/lib/easel/visibleSlots';
import { venueSlugForRoute } from '@/lib/venueSlugs';
import { setWorldPositionTick } from '@/lib/worldPositionTicks';
import { EaselSlotView } from './EaselSlotView';

const OFFSCREEN_LEFT = -22;
const OFFSCREEN_RIGHT = 122;

type Props = {
  active: boolean;
  stageSlug: string;
  session: EaselSessionSync | null;
};

function EaselSlotLayer({
  slot,
  sessionStart,
  stageSlug,
}: {
  slot: EaselSlotSync;
  sessionStart: number;
  stageSlug: string;
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

      const worldX = easelSlotWorldX(slot.slot, stageSlug, width);
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
  }, [painterReady]);

  if (painting && !painterReady) return null;

  return (
    <div
      ref={outerRef}
      data-cinema-canvas-layer
      style={{
        position: 'absolute',
        left: 0,
        bottom: CHAR_BOTTOM,
        zIndex: 15,
        willChange: 'transform',
        visibility: 'hidden',
      }}
    >
      <EaselSlotView
        stageSlug={stageSlug}
        slot={slot}
        sessionStart={sessionStart}
        paused={onScreenPaused}
        painterReady={painterReady}
      />
    </div>
  );
}

/** Ambient stage easels — one unprompted painter; user prompts are unlimited via chat. */
export const StageEaselsLayer = memo(function StageEaselsLayer({ active, stageSlug, session }: Props) {
  const visibleSlots = session ? pickVisibleEaselSlots(session.slots) : [];
  const sessionStart = session?.sessionStart ?? 0;
  if (!active || visibleSlots.length === 0) return null;

  return (
    <>
      {visibleSlots.map(slot => (
        <EaselSlotLayer
          key={slot.slot}
          slot={slot}
          sessionStart={sessionStart}
          stageSlug={stageSlug}
        />
      ))}
    </>
  );
});

export function stageSlugFromVenueRoute(route: string): string {
  if (route === 'cinema') return venueSlugForRoute('cinema');
  return venueSlugForRoute(route as 'cinema');
}
