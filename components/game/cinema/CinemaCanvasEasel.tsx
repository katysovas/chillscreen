'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  CINEMA_CANVAS_HEIGHT,
  CINEMA_CANVAS_STAGE_SLUG,
  CINEMA_CANVAS_WIDTH,
  CINEMA_EASEL_DISPLAY_SCALE,
  CINEMA_EASEL_DISPLAY_WIDTH,
  CINEMA_EASEL_FRAME_LEFT,
  CINEMA_EASEL_FRAME_TOP,
} from '@/lib/cinemaCanvasLayout';
import { fetchVenueCanvas, saveVenueCanvas } from '@/lib/venueCanvas/client';
import type { VenueCanvasStroke } from '@/lib/venueCanvas/types';

const INK_COLOR = '#262017';
const STROKE_WIDTH = 4;
const PAPER = '#fdfcf8';

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: VenueCanvasStroke[]) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, CINEMA_CANVAS_WIDTH, CINEMA_CANVAS_HEIGHT);
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0]![0], stroke.points[0]![1]);
    for (let i = 1; i < stroke.points.length; i++) {
      const pt = stroke.points[i]!;
      ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();
  }
}

type Props = { interactive: boolean };

export const CinemaCanvasEasel = memo(function CinemaCanvasEasel({ interactive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<VenueCanvasStroke[]>([]);
  const drawingRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, setLoaded] = useState(false);

  const flushSave = useCallback(() => {
    void saveVenueCanvas(CINEMA_CANVAS_STAGE_SLUG, strokesRef.current);
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      flushSave();
    }, 700);
  }, [flushSave]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawStrokes(ctx, strokesRef.current);
  }, []);

  useEffect(() => {
    redraw();
    let cancelled = false;
    void fetchVenueCanvas(CINEMA_CANVAS_STAGE_SLUG).then(strokes => {
      if (cancelled) return;
      strokesRef.current = strokes;
      setLoaded(true);
      redraw();
    });
    return () => {
      cancelled = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [redraw]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    drawingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CINEMA_CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CINEMA_CANVAS_HEIGHT;
    strokesRef.current = [
      ...strokesRef.current,
      { color: INK_COLOR, width: STROKE_WIDTH, points: [[x, y]] },
    ];
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive || !drawingRef.current) return;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    if (!stroke) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CINEMA_CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CINEMA_CANVAS_HEIGHT;
    stroke.points.push([x, y]);
    redraw();
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    scheduleSave();
  };

  const scale = CINEMA_EASEL_DISPLAY_SCALE;
  const unit = CINEMA_EASEL_DISPLAY_WIDTH;

  return (
    <div style={{ position: 'relative', width: unit, height: unit }}>
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
        style={{
          position: 'absolute',
          left: CINEMA_EASEL_FRAME_LEFT * scale,
          top: CINEMA_EASEL_FRAME_TOP * scale,
          lineHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CINEMA_CANVAS_WIDTH}
          height={CINEMA_CANVAS_HEIGHT}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          style={{
            width: CINEMA_CANVAS_WIDTH * scale,
            height: CINEMA_CANVAS_HEIGHT * scale,
            display: 'block',
            cursor: interactive ? 'crosshair' : 'default',
            touchAction: interactive ? 'none' : 'auto',
            background: PAPER,
            boxShadow: 'inset 0 0 14px #00000014',
          }}
        />
      </div>
    </div>
  );
});
