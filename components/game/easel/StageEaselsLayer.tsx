'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { CHAR_BOTTOM } from '@/components/game/groundLayout';
import { worldXToScreenPct } from '@/components/game/NPC';
import { easelSlotWorldX } from '@/lib/easel/layout';
import type { EaselSessionSync, EaselSlotSync } from '@/lib/easel/types';
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
  const worldXRef = useRef<number | null>(null);
  const onScreenRef = useRef(false);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    worldXRef.current = easelSlotWorldX(slot.slot, stageSlug);
  }, [slot.slot, stageSlug]);

  useEffect(() => {
    return setWorldPositionTick((off, width) => {
      const el = outerRef.current;
      const worldX = worldXRef.current;
      if (!el || worldX == null) return;

      const pct = worldXToScreenPct(worldX, off, width);
      const px = Math.round((pct / 100) * width);
      el.style.transform = `translateX(${px}px) translateX(-50%)`;

      const onScreen = pct >= OFFSCREEN_LEFT && pct <= OFFSCREEN_RIGHT;
      if (onScreen !== onScreenRef.current) {
        onScreenRef.current = onScreen;
        el.style.visibility = onScreen ? 'visible' : 'hidden';
        setPaused(!onScreen);
      }
    });
  }, []);

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
      <EaselSlotView stageSlug={stageSlug} slot={slot} sessionStart={sessionStart} paused={paused} />
    </div>
  );
}

/** Single ambient NPC easel per stage. */
export const StageEaselsLayer = memo(function StageEaselsLayer({ active, stageSlug, session }: Props) {
  if (!active || !session?.slots?.length) return null;

  return (
    <>
      {session.slots.map(slot => (
        <EaselSlotLayer
          key={slot.slot}
          slot={slot}
          sessionStart={session.sessionStart}
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
