import type { DrawingProgram, DrawingStroke, DrawSegment, VenueCanvasPoint } from './types';

const DEFAULT_W = 3;

/** Expand polyline strokes into ordered line segments for delta-draw. */
export function flattenProgram(program: DrawingProgram): DrawSegment[] {
  const segs: DrawSegment[] = [];
  for (const stroke of program.strokes) {
    const w = stroke.w ?? DEFAULT_W;
    const pi = stroke.pi ?? 0;
    const pts = stroke.p;
    for (let i = 1; i < pts.length; i++) {
      segs.push({ pi, w, a: pts[i - 1]!, b: pts[i]! });
    }
  }
  return segs;
}

export function totalSegments(program: DrawingProgram): number {
  return flattenProgram(program).length;
}

/** Watched-clock progress (spec v5). */
export function liveSegmentsDone(
  segmentsDone: number,
  rate: number,
  sessionStart: number,
  now = Date.now(),
): number {
  if (sessionStart <= 0) return segmentsDone;
  return segmentsDone + Math.floor(((now - sessionStart) / 1000) * rate);
}

export function clampLiveDone(live: number, total: number): number {
  return Math.max(0, Math.min(total, live));
}

/** Resolve palette index → hex; falls back to stroke.c or black. */
export function colorForSegment(
  seg: DrawSegment,
  stroke: DrawingStroke | undefined,
  palette: string[],
): string {
  if (stroke?.c) return stroke.c;
  const pi = seg.pi;
  if (pi >= 0 && pi < palette.length) return palette[pi]!;
  return palette[0] ?? '#262017';
}

/** Map stroke index for a segment cursor (for c fallback). */
export function strokeIndexForSegment(program: DrawingProgram, segIndex: number): number {
  let cursor = 0;
  for (let si = 0; si < program.strokes.length; si++) {
    const pts = program.strokes[si]!.p;
    const count = Math.max(0, pts.length - 1);
    if (segIndex < cursor + count) return si;
    cursor += count;
  }
  return program.strokes.length - 1;
}

export function validatePoint(p: VenueCanvasPoint): boolean {
  return p[0] >= 0 && p[0] <= 96 && p[1] >= 0 && p[1] <= 96;
}

export function validateProgram(program: unknown): program is DrawingProgram {
  if (!program || typeof program !== 'object') return false;
  const p = program as DrawingProgram;
  if (!p.id || !p.npc || !Array.isArray(p.strokes)) return false;
  if (p.strokes.length < 1 || p.strokes.length > 55) return false;
  for (const s of p.strokes) {
    if (!Array.isArray(s.p) || s.p.length < 2) return false;
    for (const pt of s.p) {
      if (!Array.isArray(pt) || pt.length !== 2) return false;
      if (!validatePoint(pt as VenueCanvasPoint)) return false;
    }
  }
  return true;
}

/** Deterministic next drawing index for rollover. */
export function nextDrawingIndex(npc: string, drawingId: string, poolSize: number): number {
  if (poolSize <= 1) return 0;
  let h = 0;
  const seed = `${npc}:${drawingId}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (Math.abs(h) + 1) % poolSize;
}
