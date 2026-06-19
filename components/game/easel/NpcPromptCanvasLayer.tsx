'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { CHAR_BOTTOM } from '@/components/game/groundLayout';
import { worldXToScreenPct } from '@/components/game/NPC';
import { useEaselPainterReady } from '@/lib/easel/painterReadyRegistry';
import { Z_EASEL } from '@/lib/zLayers';
import { chatDrawingRate } from '@/lib/easel/chatNpcDrawings';
import type { ChatNpcDrawingSession } from '@/lib/easel/types';
import { setWorldPositionTick } from '@/lib/worldPositionTicks';
import { AmbientCanvasDrawing } from './AmbientCanvasDrawing';

const OFFSCREEN_LEFT = -22;
const OFFSCREEN_RIGHT = 122;

type Props = {
  sessions: ChatNpcDrawingSession[];
  onSessionComplete?: (sessionId: string) => void;
};

function PromptCanvasSlot({
  session,
  onSessionComplete,
}: {
  session: ChatNpcDrawingSession;
  onSessionComplete?: (sessionId: string) => void;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const onScreenRef = useRef(false);
  const [onScreenPaused, setOnScreenPaused] = useState(true);
  const painting = session.status === 'painting';
  const registryReady = useEaselPainterReady(session.npcId, painting);
  const painterReady = session.isCompareTest || registryReady || session.status === 'done';

  useEffect(() => {
    if (!painterReady) return;
    return setWorldPositionTick((off, width) => {
      const el = outerRef.current;
      if (!el) return;

      const pct = worldXToScreenPct(session.canvasWorldX, off, width);
      const px = Math.round((pct / 100) * width);
      el.style.transform = `translateX(${px}px) translateX(-50%)`;

      const onScreen = pct >= OFFSCREEN_LEFT && pct <= OFFSCREEN_RIGHT;
      if (onScreen !== onScreenRef.current) {
        onScreenRef.current = onScreen;
        el.style.visibility = onScreen ? 'visible' : 'hidden';
        setOnScreenPaused(!onScreen);
      }
    });
  }, [painterReady, session.canvasWorldX]);

  if (painting && !painterReady) return null;

  return (
    <div
      ref={outerRef}
      data-npc-prompt-canvas
      style={{
        position: 'absolute',
        left: 0,
        bottom: CHAR_BOTTOM,
        zIndex: Z_EASEL,
        willChange: 'transform',
        visibility: 'hidden',
      }}
    >
      <AmbientCanvasDrawing
        npcId={session.npcId}
        program={session.program}
        topic={session.topic}
        totalSegments={session.totalSegments}
        rate={chatDrawingRate()}
        sessionStart={session.sessionStart}
        status={session.status}
        paused={onScreenPaused}
        painterReady={painterReady}
        logContext={{ source: 'chat-prompt', model: session.modelId }}
        onPaintingComplete={
          onSessionComplete && session.status === 'painting'
            ? () => onSessionComplete(session.id)
            : undefined
        }
      />
    </div>
  );
}

/** Chat-triggered NPC canvases — anchored next to the NPC that was asked. */
export const NpcPromptCanvasLayer = memo(function NpcPromptCanvasLayer({
  sessions,
  onSessionComplete,
}: Props) {
  if (sessions.length === 0) return null;

  return (
    <>
      {sessions.map(session => (
        <PromptCanvasSlot
          key={session.id}
          session={session}
          onSessionComplete={onSessionComplete}
        />
      ))}
    </>
  );
});
