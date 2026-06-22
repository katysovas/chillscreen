'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { checkpointEaselProgress, completeEaselDrawing } from '@/lib/easel/checkpointClient';
import { isGoldenDoodle } from '@/lib/easel/doodle/golden';
import { revealOrderForProgram } from '@/lib/easel/doodle/revealOrder';
import {
  DOODLE_CHECKPOINT_MS,
  DOODLE_REVEAL_TICK_MS,
  EASEL_DOODLE_RATE,
  liveDoodleSegmentsDone,
} from '@/lib/easel/doodle/revealCurve';
import { emitEaselMilestone } from '@/lib/easel/milestoneBus';
import { EASEL_MILESTONE_PCTS, easelMilestoneLine } from '@/lib/easel/milestoneChatter';
import { notifyEaselUpdated } from '@/lib/easel/notifyUpdated';
import { logEaselDrawing } from '@/lib/easel/logDrawing';
import { parseStartedAtMs, resolveEaselClockStart } from '@/lib/easel/sessionClock';
import type { DoodleSpriteProgram, EaselStatus } from '@/lib/easel/types';
import {
  EASEL_CANVAS_DISPLAY_HEIGHT,
  EASEL_CANVAS_DISPLAY_WIDTH,
  EASEL_DISPLAY_WIDTH,
  EASEL_FRAME_LEFT_SCALED,
  EASEL_FRAME_TOP_SCALED,
} from '@/lib/easel/layout';
import type { AmbientCanvasPersistence } from './AmbientCanvasDrawing';

export type DoodleSpriteDrawingProps = {
  npcId: string;
  program: DoodleSpriteProgram;
  topic: string;
  drawingId?: string;
  totalSegments: number;
  segmentsDone?: number;
  rate?: number;
  sessionStart: number;
  status: EaselStatus;
  paused?: boolean;
  painterReady?: boolean;
  persistence?: AmbientCanvasPersistence;
  logContext?: Record<string, unknown>;
  onPaintingComplete?: () => void;
};

type ProgressBaseline = {
  segmentsDone: number;
  clockStart: number;
  status: EaselStatus;
};

function liveDoneForBaseline(
  baseline: ProgressBaseline,
  totalSegments: number,
  rate: number,
): number {
  if (baseline.status === 'done') return totalSegments;
  return liveDoodleSegmentsDone(
    baseline.segmentsDone,
    totalSegments,
    rate,
    baseline.clockStart,
  );
}

function paintCoverCanvas(
  ctx: CanvasRenderingContext2D,
  program: DoodleSpriteProgram,
  revealOrder: number[],
  revealed: number,
): void {
  const cellW = EASEL_CANVAS_DISPLAY_WIDTH / program.w;
  const cellH = EASEL_CANVAS_DISPLAY_HEIGHT / program.h;

  ctx.fillStyle = program.bgHex;
  ctx.fillRect(0, 0, EASEL_CANVAS_DISPLAY_WIDTH, EASEL_CANVAS_DISPLAY_HEIGHT);

  if (program.revealMode === 'band') {
    const bandH = EASEL_CANVAS_DISPLAY_HEIGHT / revealOrder.length;
    for (let i = revealed; i < revealOrder.length; i++) {
      const bandIdx = revealOrder[i]!;
      ctx.fillRect(0, bandIdx * bandH, EASEL_CANVAS_DISPLAY_WIDTH, bandH + 0.5);
    }
    return;
  }

  for (let i = revealed; i < revealOrder.length; i++) {
    const cellIdx = revealOrder[i]!;
    const col = cellIdx % program.w;
    const row = Math.floor(cellIdx / program.w);
    ctx.fillRect(col * cellW, row * cellH, cellW + 0.5, cellH + 0.5);
  }
}

function clearRevealedCells(
  ctx: CanvasRenderingContext2D,
  program: DoodleSpriteProgram,
  revealOrder: number[],
  from: number,
  to: number,
): void {
  const cellW = EASEL_CANVAS_DISPLAY_WIDTH / program.w;
  const cellH = EASEL_CANVAS_DISPLAY_HEIGHT / program.h;

  if (program.revealMode === 'band') {
    const bandH = EASEL_CANVAS_DISPLAY_HEIGHT / revealOrder.length;
    for (let i = from; i < to && i < revealOrder.length; i++) {
      const bandIdx = revealOrder[i]!;
      ctx.clearRect(0, bandIdx * bandH, EASEL_CANVAS_DISPLAY_WIDTH, bandH + 0.5);
    }
    return;
  }

  for (let i = from; i < to && i < revealOrder.length; i++) {
    const cellIdx = revealOrder[i]!;
    const col = cellIdx % program.w;
    const row = Math.floor(cellIdx / program.w);
    ctx.clearRect(col * cellW, row * cellH, cellW + 0.5, cellH + 0.5);
  }
}

/** Easel frame + curated sprite revealed via canvas cover mask (spec §7). */
export const DoodleSpriteDrawing = memo(function DoodleSpriteDrawing({
  npcId,
  program,
  topic,
  drawingId,
  totalSegments,
  segmentsDone = 0,
  rate = EASEL_DOODLE_RATE,
  sessionStart,
  status,
  paused = false,
  painterReady = true,
  persistence,
  logContext,
  onPaintingComplete,
}: DoodleSpriteDrawingProps) {
  const coverCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<ProgressBaseline>({
    segmentsDone,
    clockStart: 0,
    status,
  });
  const completingRef = useRef(false);
  const lastPaintedRevealRef = useRef(0);
  const milestonesHitRef = useRef(new Set<number>());
  const [revealed, setRevealed] = useState(() =>
    status === 'done' ? totalSegments : segmentsDone,
  );
  const [tabHidden, setTabHidden] = useState(false);
  const label = topic.trim() || program.topic || 'sketch';
  const artId = drawingId ?? program.id;
  const golden = isGoldenDoodle(artId);
  const loggedRef = useRef<string | null>(null);

  const revealOrder = useMemo(
    () => revealOrderForProgram(program.id, program.w, program.h, program.revealMode),
    [program.id, program.w, program.h, program.revealMode],
  );

  useEffect(() => {
    const onVis = () => setTabHidden(document.visibilityState === 'hidden');
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (status === 'done') {
      setRevealed(totalSegments);
      return;
    }
    setRevealed(prev => Math.max(prev, segmentsDone));
  }, [segmentsDone, status, totalSegments]);

  useEffect(() => {
    const key = `${program.id}:${status}:${segmentsDone}`;
    if (loggedRef.current === key) return;
    loggedRef.current = key;
    logEaselDrawing('client', npcId, label, {
      status,
      progress: `${segmentsDone}/${totalSegments}`,
      id: program.id,
      kind: 'doodle-sprite',
      golden,
      ...logContext,
    });
  }, [npcId, program.id, status, segmentsDone, totalSegments, label, logContext, golden]);

  useEffect(() => {
    progressRef.current = {
      segmentsDone,
      clockStart: resolveEaselClockStart(
        painterReady,
        sessionStart,
        progressRef.current.clockStart,
      ),
      status,
    };
  }, [segmentsDone, sessionStart, status, painterReady]);

  useEffect(() => {
    milestonesHitRef.current = new Set();
    lastPaintedRevealRef.current = 0;
  }, [program.id, artId]);

  useEffect(() => {
    const canvas = coverCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.round(EASEL_CANVAS_DISPLAY_WIDTH * dpr);
    canvas.height = Math.round(EASEL_CANVAS_DISPLAY_HEIGHT * dpr);
    canvas.style.width = `${EASEL_CANVAS_DISPLAY_WIDTH}px`;
    canvas.style.height = `${EASEL_CANVAS_DISPLAY_HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = status === 'done' ? totalSegments : revealed;
    paintCoverCanvas(ctx, program, revealOrder, target);
    lastPaintedRevealRef.current = target;
  }, [program, revealOrder, status, totalSegments]);

  useEffect(() => {
    const canvas = coverCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const target = status === 'done' ? totalSegments : revealed;
    const prev = lastPaintedRevealRef.current;
    if (target <= prev) return;

    if (prev === 0 && target > 0) {
      paintCoverCanvas(ctx, program, revealOrder, target);
    } else {
      clearRevealedCells(ctx, program, revealOrder, prev, target);
    }
    lastPaintedRevealRef.current = target;
  }, [revealed, program, revealOrder, status, totalSegments]);

  useEffect(() => {
    if (!painterReady || paused || tabHidden) return;
    if (status === 'done') {
      setRevealed(totalSegments);
      return;
    }
    const tick = () => {
      const live = liveDoneForBaseline(progressRef.current, totalSegments, rate);
      setRevealed(live);

      if (totalSegments > 0) {
        const pct = Math.floor((live / totalSegments) * 100);
        for (const milestone of EASEL_MILESTONE_PCTS) {
          if (pct < milestone || milestonesHitRef.current.has(milestone)) continue;
          milestonesHitRef.current.add(milestone);
          const line = easelMilestoneLine(label, milestone, artId);
          if (line) {
            emitEaselMilestone({ npcId, topic: label, pct: milestone, line });
          }
        }
      }
    };
    tick();
    const id = setInterval(tick, DOODLE_REVEAL_TICK_MS);
    return () => clearInterval(id);
  }, [painterReady, paused, tabHidden, status, totalSegments, rate, npcId, label, artId]);

  useEffect(() => {
    if (status === 'done' || !painterReady) return;

    const applyDone = () => {
      progressRef.current = { ...progressRef.current, status: 'done' };
      setRevealed(totalSegments);
      logEaselDrawing('client', npcId, label, { status: 'done', finished: true, kind: 'doodle-sprite', ...logContext });
      onPaintingComplete?.();
    };

    const applyCheckpoint = (result: {
      segments_done: number;
      started_at: string;
      status: EaselStatus;
    }) => {
      const ms = parseStartedAtMs(result.started_at) ?? Date.now();
      progressRef.current = {
        segmentsDone: result.segments_done,
        clockStart: ms,
        status: result.status,
      };
      if (result.status === 'done') {
        applyDone();
        notifyEaselUpdated();
      }
    };

    const persist = () => {
      const baseline = progressRef.current;
      if (baseline.status === 'done' || completingRef.current) return;

      const live = liveDoneForBaseline(baseline, totalSegments, rate);
      if (live >= totalSegments) {
        completingRef.current = true;
        if (persistence) {
          void completeEaselDrawing(persistence.stageSlug, persistence.slot).then(result => {
            completingRef.current = false;
            if (result) applyCheckpoint(result);
          });
        } else {
          completingRef.current = false;
          applyDone();
        }
        return;
      }

      if (!persistence || live <= baseline.segmentsDone) return;
      void checkpointEaselProgress(persistence.stageSlug, persistence.slot, live).then(result => {
        if (result) applyCheckpoint(result);
      });
    };

    const interval = setInterval(persist, DOODLE_CHECKPOINT_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', onHide);
      if (progressRef.current.status !== 'done' && !completingRef.current) {
        persist();
      }
    };
  }, [npcId, program.id, totalSegments, rate, status, painterReady, persistence, label, logContext, onPaintingComplete]);

  return (
    <div style={{ position: 'relative', width: EASEL_DISPLAY_WIDTH, height: EASEL_DISPLAY_WIDTH }}>
      <svg
        viewBox="-9 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}
      >
        <g stroke="none" fill="none" fillRule="evenodd">
          <g transform="translate(1,1)" stroke="#6B6C6E" strokeWidth={2}>
            <path d="M12.5,45 L10.8,50 L6.5,50 L8.2,45" />
            <path d="M30.5,45 L32.2,50 L36.5,50 L34.8,45" />
            <rect x="20" y="45" width="4" height="4" />
            <rect x="19" y="0" width="4" height="9" />
            <path d="M42,37 C43.1,37 44,37.9 44,39 L44,43 C44,44.1 43.1,45 42,45 L2,45 C0.9,45 0,44.1 0,43 L0,39 C0,37.9 0.9,37 2,37" />
            <path d="M40.2,41 L4,41 C2.9,41 2,40.1 2,39 L2,11 C2,9.9 2.9,9 4,9 L40.2,9 C41.3,9 42,9.9 42,11 L42,39 C42,40.1 41.3,41 40.2,41 Z" />
          </g>
        </g>
      </svg>
      <div
        className={golden ? 'easel-doodle-golden' : undefined}
        style={{
          position: 'absolute',
          left: EASEL_FRAME_LEFT_SCALED,
          top: EASEL_FRAME_TOP_SCALED,
          width: EASEL_CANVAS_DISPLAY_WIDTH,
          height: EASEL_CANVAS_DISPLAY_HEIGHT,
          lineHeight: 0,
          overflow: 'hidden',
          background: program.bgHex,
          boxShadow: golden
            ? 'inset 0 0 14px #00000014, 0 0 12px #ffd70066'
            : 'inset 0 0 14px #00000014',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={program.spritePath}
          alt=""
          width={EASEL_CANVAS_DISPLAY_WIDTH}
          height={EASEL_CANVAS_DISPLAY_HEIGHT}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
            pointerEvents: 'none',
          }}
        />
        <canvas
          ref={coverCanvasRef}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
});
