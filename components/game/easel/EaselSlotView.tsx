'use client';

import { memo, useEffect, useRef } from 'react';
import { createEaselController } from '@/lib/easel/easelController';
import { checkpointEaselProgress, completeEaselDrawing } from '@/lib/easel/checkpointClient';
import { modelLabelForNpc, npcPoolKey, paletteForNpc } from '@/lib/easel/drawingsPool';
import { notifyEaselUpdated } from '@/lib/easel/notifyUpdated';
import { logEaselDrawing } from '@/lib/easel/logDrawing';
import { programForSlot } from '@/lib/easel/resolveProgram';
import { clampLiveDone, liveSegmentsDone } from '@/lib/easel/segments';
import { easelClockStart, parseStartedAtMs } from '@/lib/easel/sessionClock';
import type { EaselSlotSync } from '@/lib/easel/types';
import { EASEL_DISPLAY_WIDTH } from '@/lib/easel/layout';

const CHECKPOINT_MS = 12_000;

type Props = {
  stageSlug: string;
  slot: EaselSlotSync;
  sessionStart: number;
  paused?: boolean;
  /** Painting NPC is at the easel stand — drawing clock may run. */
  painterReady?: boolean;
};

type ProgressBaseline = {
  segmentsDone: number;
  clockStart: number;
  status: EaselSlotSync['status'];
  startedAt?: string;
};

function baselineFromSlot(
  slot: EaselSlotSync,
  sessionStart: number,
  painterReady: boolean,
): ProgressBaseline {
  const clockSessionStart = painterReady && sessionStart > 0 ? sessionStart : 0;
  return {
    segmentsDone: slot.segments_done,
    clockStart: easelClockStart(slot, clockSessionStart),
    status: slot.status,
    startedAt: slot.started_at,
  };
}

function liveDoneForBaseline(slot: EaselSlotSync, baseline: ProgressBaseline): number {
  if (baseline.status === 'done') return slot.total_segments;
  return clampLiveDone(
    liveSegmentsDone(baseline.segmentsDone, slot.rate, baseline.clockStart),
    slot.total_segments,
  );
}

/** Single easel frame + ambient canvas (NPC drawing, no user input). */
export const EaselSlotView = memo(function EaselSlotView({
  stageSlug,
  slot,
  sessionStart,
  paused = false,
  painterReady = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef(createEaselController());
  const progressRef = useRef<ProgressBaseline>(baselineFromSlot(slot, sessionStart, painterReady));
  const completingRef = useRef(false);
  const unit = EASEL_DISPLAY_WIDTH;
  const artScale = unit / 460;
  const frameLeft = 94 * artScale;
  const frameTop = 80 * artScale;
  const canvasDisplay = (272 / 460) * unit;
  const npcKey = npcPoolKey(slot.npc);
  const model = modelLabelForNpc(npcKey);
  const name = slot.npc.split('-').pop() ?? slot.npc;
  const label = slot.topic?.trim() || programForSlot(slot)?.topic || `${model} ${name}`;
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    const program = programForSlot(slot);
    if (!program) {
      console.warn('[easel:client] no AI program on slot — waiting for server', slot.drawing_id);
      return;
    }
    const key = `${slot.drawing_id}:${slot.status}:${slot.segments_done}`;
    if (loggedRef.current === key) return;
    loggedRef.current = key;
    logEaselDrawing('client', slot.npc, label, {
      stage: stageSlug,
      slot: slot.slot,
      status: slot.status,
      progress: `${slot.segments_done}/${slot.total_segments}`,
      id: slot.drawing_id,
    });
  }, [slot, stageSlug, label]);

  useEffect(() => {
    progressRef.current = baselineFromSlot(slot, sessionStart, painterReady);
  }, [slot, sessionStart, painterReady]);

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
    if (!canvas) return;
    const program = programForSlot(slot);
    if (!program) {
      console.warn('[easel:client] no AI program to render', slot.drawing_id);
      return;
    }

    const baseline = progressRef.current;
    const ctrl = controllerRef.current;
    ctrl.mount(canvas);
    ctrl.load({
      program,
      palette: paletteForNpc(npcKey),
      segmentsDone: liveDoneForBaseline(slot, baseline),
      status: baseline.status,
    });
    ctrl.setProgressSource(() => liveDoneForBaseline(slot, progressRef.current));
    if (paused) ctrl.pause();
    else ctrl.resume();

    return () => ctrl.destroy();
  }, [slot, sessionStart, slot.program, slot.drawing_id]);

  useEffect(() => {
    if (paused) controllerRef.current.pause();
    else controllerRef.current.resume();
  }, [paused]);

  useEffect(() => {
    if (slot.status === 'done') return;
    if (!painterReady) return;

    const applyCheckpoint = (result: { segments_done: number; started_at: string; status: 'painting' | 'done' }) => {
      const ms = parseStartedAtMs(result.started_at) ?? Date.now();
      progressRef.current = {
        segmentsDone: result.segments_done,
        clockStart: ms,
        status: result.status,
        startedAt: result.started_at,
      };
      if (result.status === 'done') {
        const doneProgram = programForSlot({ ...slot, status: 'done' });
        if (doneProgram) {
          controllerRef.current.load({
            program: doneProgram,
            palette: paletteForNpc(npcKey),
            segmentsDone: slot.total_segments,
            status: 'done',
          });
        }
        notifyEaselUpdated();
        logEaselDrawing('client', slot.npc, label, {
          stage: stageSlug,
          status: 'done',
          finished: true,
        });
      }
    };

    const persist = () => {
      const baseline = progressRef.current;
      if (baseline.status === 'done' || completingRef.current) return;

      const live = liveDoneForBaseline(slot, baseline);
      if (live >= slot.total_segments) {
        completingRef.current = true;
        void completeEaselDrawing(stageSlug, slot.slot).then(result => {
          completingRef.current = false;
          if (result) applyCheckpoint(result);
        });
        return;
      }

      if (live <= baseline.segmentsDone) return;
      void checkpointEaselProgress(stageSlug, slot.slot, live).then(result => {
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
  }, [stageSlug, slot, npcKey, painterReady]);

  return (
    <div style={{ position: 'relative', width: unit, height: unit }}>
      <div
        style={{
          position: 'absolute',
          top: -18,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10,
          color: '#4a4a4a',
          whiteSpace: 'nowrap',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </div>
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
          left: frameLeft,
          top: frameTop,
          lineHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: canvasDisplay,
            height: canvasDisplay,
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
