import {
  clampLiveDone,
  colorForSegment,
  flattenProgram,
  strokeIndexForSegment,
} from './segments';
import type { DrawingProgram, DrawSegment, EaselStatus } from './types';
import { EASEL_LOGICAL_SIZE, EASEL_SEGMENTS_PER_STEP, EASEL_STEP_MS } from './types';

export type EaselControllerLoad = {
  program: DrawingProgram;
  palette: string[];
  segmentsDone: number;
  status: EaselStatus;
  stepMs?: number;
  segmentsPerStep?: number;
};

export type EaselController = {
  mount(canvas: HTMLCanvasElement, dpr?: number): void;
  /** Re-apply backing store after layout (e.g. parent was visibility:hidden at mount). */
  relayout(): boolean;
  load(opts: EaselControllerLoad): void;
  setProgressSource(fn: () => number): void;
  pause(): void;
  resume(): void;
  destroy(): void;
};

export function createEaselController(): EaselController {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let dpr = 1;
  let displayScale = 1;
  let segs: DrawSegment[] = [];
  let program: DrawingProgram | null = null;
  let palette: string[] = [];
  let cursor = 0;
  let progressFn: (() => number) | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let paused = false;
  let stepMs = EASEL_STEP_MS;
  let segmentsPerStep = EASEL_SEGMENTS_PER_STEP;
  let lastStatus: EaselStatus = 'painting';
  const PAPER = '#fdfcf8';

  function applyCanvasSize(): boolean {
    if (!canvas || !ctx) return false;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    displayScale = rect.width / EASEL_LOGICAL_SIZE;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr * displayScale, 0, 0, dpr * displayScale, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return true;
  }

  function paintPaper() {
    if (!ctx || !canvas) return;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, EASEL_LOGICAL_SIZE, EASEL_LOGICAL_SIZE);
  }

  function drawSegment(i: number) {
    if (!ctx || !program) return;
    const s = segs[i];
    if (!s) return;
    const stroke = program.strokes[strokeIndexForSegment(program, i)];
    ctx.strokeStyle = colorForSegment(s, stroke, palette);
    ctx.lineWidth = s.w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(s.a[0], s.a[1]);
    ctx.lineTo(s.b[0], s.b[1]);
    ctx.stroke();
  }

  function seek(to: number) {
    if (!ctx) return;
    paintPaper();
    cursor = 0;
    const n = Math.min(to, segs.length);
    for (let i = 0; i < n; i++) drawSegment(i);
    cursor = n;
  }

  function step() {
    if (paused || !ctx || !progressFn) return;
    const target = clampLiveDone(progressFn(), segs.length);
    const end = Math.min(target, cursor + segmentsPerStep);
    for (let i = cursor; i < end; i++) drawSegment(i);
    cursor = end;
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(step, stepMs);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    mount(el, devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1) {
      canvas = el;
      dpr = devicePixelRatio;
      ctx = el.getContext('2d');
      if (!ctx) return;
      applyCanvasSize();
    },

    relayout() {
      if (!canvas || !ctx || !program) return false;
      const saved = cursor;
      if (!applyCanvasSize()) return false;
      seek(saved);
      if (!paused && lastStatus === 'painting' && segs.length > cursor) startTimer();
      else stopTimer();
      return true;
    },

    load(opts) {
      program = opts.program;
      palette = opts.palette;
      segs = flattenProgram(opts.program);
      stepMs = opts.stepMs ?? EASEL_STEP_MS;
      segmentsPerStep = opts.segmentsPerStep ?? EASEL_SEGMENTS_PER_STEP;
      lastStatus = opts.status;
      if (!ctx || !applyCanvasSize()) return;
      seek(opts.segmentsDone);
      if (opts.status === 'painting') startTimer();
      else stopTimer();
    },

    setProgressSource(fn) {
      progressFn = fn;
    },

    pause() {
      paused = true;
      stopTimer();
    },

    resume() {
      paused = false;
      if (program && segs.length > cursor) startTimer();
      step();
    },

    destroy() {
      stopTimer();
      canvas = null;
      ctx = null;
      progressFn = null;
    },
  };
}
