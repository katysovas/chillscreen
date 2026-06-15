/** Convert pixel-llm grid cells into easel stroke programs. */

import { EASEL_LOGICAL_SIZE } from '../types';
import type { DrawingProgram, DrawingStroke } from '../types';
import type { GridPixel } from './types';

export const PIXEL_GRID_LOGICAL_SIZE = 32;
const SCALE = EASEL_LOGICAL_SIZE / PIXEL_GRID_LOGICAL_SIZE;

function scaleCoord(v: number): number {
  return Math.max(0, Math.min(EASEL_LOGICAL_SIZE, Math.round(v * SCALE + SCALE / 2)));
}

/** Center parsed pixels on the grid — no upscaling. */
export function layoutPixelsOnGrid(
  pixels: GridPixel[],
  gridSize: number = PIXEL_GRID_LOGICAL_SIZE,
): GridPixel[] {
  if (pixels.length === 0) return pixels;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pixels) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const shiftX = Math.floor((gridSize - bw) / 2) - minX;
  const shiftY = Math.floor((gridSize - bh) / 2) - minY;

  if (shiftX === 0 && shiftY === 0) return pixels;

  return pixels.map(p => ({
    ...p,
    x: Math.max(0, Math.min(gridSize - 1, p.x + shiftX)),
    y: Math.max(0, Math.min(gridSize - 1, p.y + shiftY)),
  }));
}

/** Merge same-row, same-color pixels into horizontal polyline strokes. */
export function gridPixelsToStrokes(pixels: GridPixel[]): DrawingStroke[] {
  if (pixels.length === 0) return [];

  const sorted = [...pixels].sort((a, b) => a.y - b.y || a.x - b.x || a.pi - b.pi);
  const strokes: DrawingStroke[] = [];
  const strokeWidth = 4;

  let runPi = sorted[0]!.pi;
  let runY = sorted[0]!.y;
  let runPoints: [number, number][] = [[scaleCoord(sorted[0]!.x), scaleCoord(sorted[0]!.y)]];

  function flush() {
    if (runPoints.length >= 2) {
      strokes.push({ pi: runPi, w: strokeWidth, p: runPoints });
    } else if (runPoints.length === 1) {
      const [x, y] = runPoints[0]!;
      strokes.push({ pi: runPi, w: strokeWidth, p: [[x, y], [x + 2, y + 2]] });
    }
  }

  for (let i = 1; i < sorted.length; i++) {
    const px = sorted[i]!;
    const prev = sorted[i - 1]!;
    const pt: [number, number] = [scaleCoord(px.x), scaleCoord(px.y)];

    const sameRun =
      px.y === runY
      && px.pi === runPi
      && px.x === prev.x + 1
      && pt[0] === scaleCoord(prev.x) + SCALE;

    if (sameRun) {
      runPoints.push(pt);
    } else {
      flush();
      runPi = px.pi;
      runY = px.y;
      runPoints = [pt];
    }
  }
  flush();

  return strokes;
}

export function gridToDrawingProgram(
  pixels: GridPixel[],
  npcKey: string,
  topic: string,
  modelLabel: string,
): DrawingProgram | null {
  const laidOut = layoutPixelsOnGrid(pixels);
  const strokes = gridPixelsToStrokes(laidOut);
  if (strokes.length < 4) return null;

  return {
    id: `pixel_${npcKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    npc: npcKey,
    model: modelLabel,
    topic: topic.slice(0, 48),
    strokes,
  };
}
