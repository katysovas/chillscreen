import type { DoodleGridFile } from './types';
import { DOODLE_TRANSPARENT } from './types';

export type StructuralQcResult = {
  pass: boolean;
  reason?: string;
  coloredCells: number;
};

const MIN_COLORED = 40;
const MAX_FILL_RATIO = 0.85;
const MIN_BBOX_FILL = 0.22;

/** Cheap rules-only QC before vision scoring — drops obvious failures. */
export function structuralGridCheck(grid: DoodleGridFile): StructuralQcResult {
  const { w, h, rows } = grid;
  let colored = 0;
  let minX = w;
  let maxX = -1;
  let minY = h;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    const row = rows[y] ?? [];
    for (let x = 0; x < w; x++) {
      const pi = row[x] ?? DOODLE_TRANSPARENT;
      if (pi < 0) continue;
      colored++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (colored < MIN_COLORED) {
    return { pass: false, reason: `too sparse (${colored} cells)`, coloredCells: colored };
  }

  const total = w * h;
  if (colored / total > MAX_FILL_RATIO) {
    return { pass: false, reason: 'fills too much of grid', coloredCells: colored };
  }

  if (maxX < minX || maxY < minY) {
    return { pass: false, reason: 'no colored pixels', coloredCells: colored };
  }

  const bboxArea = (maxX - minX + 1) * (maxY - minY + 1);
  if (colored / bboxArea < MIN_BBOX_FILL) {
    return { pass: false, reason: 'object too hollow', coloredCells: colored };
  }

  return { pass: true, coloredCells: colored };
}
