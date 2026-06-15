'use client';

import { memo } from 'react';
import { AmbientCanvasDrawing } from './AmbientCanvasDrawing';
import { easelPaintingLabelForSlot } from '@/lib/easel/paintingLabel';
import { programForSlot } from '@/lib/easel/resolveProgram';
import { easelClockStart } from '@/lib/easel/sessionClock';
import type { EaselSlotSync } from '@/lib/easel/types';

type Props = {
  stageSlug: string;
  slot: EaselSlotSync;
  sessionStart: number;
  paused?: boolean;
  painterReady?: boolean;
};

/** Stage easel slot — thin wrapper around {@link AmbientCanvasDrawing}. */
export const EaselSlotView = memo(function EaselSlotView({
  stageSlug,
  slot,
  sessionStart,
  paused = false,
  painterReady = true,
}: Props) {
  const program = programForSlot(slot);
  if (!program) return null;

  const clockStart = easelClockStart(slot, sessionStart);

  return (
    <AmbientCanvasDrawing
      npcId={slot.npc}
      program={program}
      topic={easelPaintingLabelForSlot(slot)}
      totalSegments={slot.total_segments}
      segmentsDone={slot.segments_done}
      rate={slot.rate}
      sessionStart={clockStart}
      status={slot.status}
      paused={paused}
      painterReady={painterReady}
      persistence={{ stageSlug, slot: slot.slot, drawingId: slot.drawing_id }}
      logContext={{ stage: stageSlug, slot: slot.slot }}
    />
  );
});
