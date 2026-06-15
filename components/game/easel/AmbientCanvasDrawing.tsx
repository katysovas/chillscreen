'use client';

import { memo, useEffect, useRef } from 'react';
import { createEaselController } from '@/lib/easel/easelController';
import { checkpointEaselProgress, completeEaselDrawing } from '@/lib/easel/checkpointClient';
import { npcPoolKey, paletteForNpc } from '@/lib/easel/drawingsPool';
import { notifyEaselUpdated } from '@/lib/easel/notifyUpdated';
import { iwarn } from '@/lib/internalDebug';
import { logEaselDrawing } from '@/lib/easel/logDrawing';
import { clampLiveDone, liveSegmentsDone } from '@/lib/easel/segments';
import { parseStartedAtMs } from '@/lib/easel/sessionClock';
import type { DrawingProgram, EaselStatus } from '@/lib/easel/types';
import { EASEL_DEFAULT_RATE } from '@/lib/easel/types';
import { EASEL_DISPLAY_WIDTH } from '@/lib/easel/layout';

const CHECKPOINT_MS = 12_000;
const ART_SCALE = EASEL_DISPLAY_WIDTH / 460;
const FRAME_LEFT = 94 * ART_SCALE;
const FRAME_TOP = 80 * ART_SCALE;
const CANVAS_DISPLAY = (272 / 460) * EASEL_DISPLAY_WIDTH;

export type AmbientCanvasPersistence = {
  stageSlug: string;
  slot: number;
  drawingId: string;
};

export type AmbientCanvasDrawingProps = {
  npcId: string;
  program: DrawingProgram;
  topic: string;
  totalSegments: number;
  segmentsDone?: number;
  rate?: number;
  sessionStart: number;
  status: EaselStatus;
  paused?: boolean;
  painterReady?: boolean;
  /** When set, checkpoints/completes via `/api/easel`. Omit for local-only chat drawings. */
  persistence?: AmbientCanvasPersistence;
  logContext?: Record<string, unknown>;
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
  return clampLiveDone(
    liveSegmentsDone(baseline.segmentsDone, rate, baseline.clockStart),
    totalSegments,
  );
}

/** Reusable easel frame + ambient stroke canvas (NPC drawing, no user input). */
export const AmbientCanvasDrawing = memo(function AmbientCanvasDrawing({
  npcId,
  program,
  topic,
  totalSegments,
  segmentsDone = 0,
  rate = EASEL_DEFAULT_RATE,
  sessionStart,
  status,
  paused = false,
  painterReady = true,
  persistence,
  logContext,
}: AmbientCanvasDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef(createEaselController());
  const progressRef = useRef<ProgressBaseline>({
    segmentsDone,
    clockStart: painterReady && sessionStart > 0 ? sessionStart : 0,
    status,
  });
  const completingRef = useRef(false);
  const npcKey = npcPoolKey(npcId);
  const label = topic.trim() || program.topic || 'sketch';
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${program.id}:${status}:${segmentsDone}`;
    if (loggedRef.current === key) return;
    loggedRef.current = key;
    logEaselDrawing('client', npcId, label, {
      status,
      progress: `${segmentsDone}/${totalSegments}`,
      id: program.id,
      ...logContext,
    });
  }, [npcId, program.id, status, segmentsDone, totalSegments, label, logContext]);

  useEffect(() => {
    progressRef.current = {
      segmentsDone,
      clockStart: painterReady && sessionStart > 0 ? sessionStart : 0,
      status,
    };
  }, [segmentsDone, sessionStart, status, painterReady]);

  const wasPainterReadyRef = useRef(painterReady);
  useEffect(() => {
    const justReady = painterReady && !wasPainterReadyRef.current;
    wasPainterReadyRef.current = painterReady;
    if (!justReady) return;
    const partyJustStarted = sessionStart > 0 && Date.now() - sessionStart < 3000;
    progressRef.current = {
      ...progressRef.current,
      clockStart: partyJustStarted ? sessionStart : Date.now(),
    };
  }, [painterReady, sessionStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !painterReady) return;

    const bindCanvas = () => {
      const baseline = progressRef.current;
      const ctrl = controllerRef.current;
      ctrl.mount(canvas);
      ctrl.load({
        program,
        palette: paletteForNpc(npcKey),
        segmentsDone: liveDoneForBaseline(baseline, totalSegments, rate),
        status: baseline.status,
      });
      ctrl.setProgressSource(() =>
        liveDoneForBaseline(progressRef.current, totalSegments, rate),
      );
      if (paused) ctrl.pause();
      else ctrl.resume();
    };

    bindCanvas();

    const ro = new ResizeObserver(() => {
      const ctrl = controllerRef.current;
      if (ctrl.relayout()) {
        if (paused) ctrl.pause();
        else ctrl.resume();
      } else {
        bindCanvas();
      }
    });
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      controllerRef.current.destroy();
    };
  }, [program, npcKey, painterReady, paused, totalSegments, rate]);

  useEffect(() => {
    if (status === 'done' || !painterReady) return;

    const applyDone = () => {
      progressRef.current = {
        ...progressRef.current,
        status: 'done',
      };
      controllerRef.current.load({
        program,
        palette: paletteForNpc(npcKey),
        segmentsDone: totalSegments,
        status: 'done',
      });
      logEaselDrawing('client', npcId, label, { status: 'done', finished: true, ...logContext });
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

    const interval = setInterval(persist, CHECKPOINT_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', onHide);
      persist();
    };
  }, [npcId, npcKey, program, totalSegments, rate, status, painterReady, persistence, label, logContext]);

  return (
    <div style={{ position: 'relative', width: EASEL_DISPLAY_WIDTH, height: EASEL_DISPLAY_WIDTH }}>
      <svg
        viewBox="-9 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
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
        style={{
          position: 'absolute',
          left: FRAME_LEFT,
          top: FRAME_TOP,
          lineHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: CANVAS_DISPLAY,
            height: CANVAS_DISPLAY,
            display: 'block',
            background: '#fdfcf8',
            boxShadow: 'inset 0 0 14px #00000014',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
});
