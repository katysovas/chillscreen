'use client';

import { memo } from 'react';
import { AmbientCanvasDrawing } from './AmbientCanvasDrawing';
import { DoodleSpriteDrawing } from './DoodleSpriteDrawing';
import { isDoodleSpriteProgram } from '@/lib/easel/doodle/program';
import { resolveSlotArt } from '@/lib/easel/doodle/resolveSlotArt';
import { easelPaintingLabelForSlot } from '@/lib/easel/paintingLabel';
import { easelClockStart } from '@/lib/easel/sessionClock';
import type { EaselSlotSync } from '@/lib/easel/types';
import type { VenueRoute } from '@/lib/venueSlugs';

type Props = {
  stageSlug: string;
  layoutRoute?: VenueRoute | null;
  slot: EaselSlotSync;
  sessionStart: number;
  paused?: boolean;
  painterReady?: boolean;
};

/** Stage easel slot — manifest doodle sprite wins over cached stroke programs. */
export const EaselSlotView = memo(function EaselSlotView({
  stageSlug,
  layoutRoute,
  slot,
  sessionStart,
  paused = false,
  painterReady = true,
}: Props) {
  const resolved = resolveSlotArt(stageSlug, slot, layoutRoute);
  if (!resolved) return null;

  const clockStart = easelClockStart(slot, sessionStart);
  const label = easelPaintingLabelForSlot(slot);
  const persistence = { stageSlug, slot: slot.slot, drawingId: slot.drawing_id };
  const shared = {
    npcId: slot.npc,
    topic: label,
    totalSegments: resolved.totalSegments,
    segmentsDone: resolved.segmentsDone,
    rate: slot.rate,
    sessionStart: clockStart,
    status: slot.status,
    paused,
    painterReady,
    persistence,
    logContext: {
      stage: stageSlug,
      slot: slot.slot,
      art: isDoodleSpriteProgram(resolved.art) ? 'doodle-sprite' : 'stroke',
      manifestOverride: resolved.fromManifest,
    },
  };

  if (isDoodleSpriteProgram(resolved.art)) {
    return (
      <DoodleSpriteDrawing
        program={resolved.art}
        drawingId={slot.drawing_id}
        {...shared}
      />
    );
  }

  return (
    <AmbientCanvasDrawing
      program={resolved.art}
      {...shared}
    />
  );
});
