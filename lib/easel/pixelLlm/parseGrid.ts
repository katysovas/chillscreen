/** Adapted from https://github.com/mxmarchal/pixel-llm (MIT) */

import { LETTER_TO_PI } from './prompt';
import type { CanvasSize, GridPixel } from './types';

export type GridValidation = {
  ok: boolean;
  critique: string | null;
  rowSpan: number;
  colSpan: number;
  pixelCount: number;
};

/**
 * Parse pixel-llm GRID output into grid cells with palette indices.
 * Format:
 *   OFFSET:x,y
 *   GRID:
 *   ..RR..
 */
export function parsePixelGridResponse(response: string, canvasSize: CanvasSize): GridPixel[] {
  const valid: GridPixel[] = [];

  let offsetX = 0;
  let offsetY = 0;
  const offsetMatch = response.match(/OFFSET:\s*(\d+)\s*,\s*(\d+)/i);
  if (offsetMatch) {
    offsetX = parseInt(offsetMatch[1]!, 10);
    offsetY = parseInt(offsetMatch[2]!, 10);
  }

  const gridMatch = response.match(/GRID:\s*\n([\s\S]*)/i);
  if (gridMatch) {
    const gridLines: string[] = [];
    for (const line of gridMatch[1]!.split('\n')) {
      const trimmed = line.trim();
      if (trimmed === '') break;
      if (trimmed.startsWith('OFFSET') || trimmed.startsWith('GRID')) break;
      if (trimmed.startsWith('*') || trimmed.startsWith('(') || trimmed.startsWith('-')) break;
      if (/^[.A-Za-z]+$/.test(trimmed)) {
        gridLines.push(trimmed);
      } else {
        break;
      }
    }

    for (let row = 0; row < gridLines.length; row++) {
      const line = gridLines[row]!;
      for (let col = 0; col < line.length; col++) {
        const char = line[col]!.toUpperCase();
        if (char === '.') continue;
        const pi = LETTER_TO_PI[char];
        if (pi === undefined) continue;
        const x = offsetX + col;
        const y = offsetY + row;
        if (x >= 0 && x < canvasSize.width && y >= 0 && y < canvasSize.height) {
          valid.push({ x, y, pi });
        }
      }
    }
  }

  return valid;
}

/** Reject tiny/sparse grids; return critique for retry prompts. */
export function validateGridPixels(pixels: GridPixel[], canvasSize: CanvasSize): GridValidation {
  if (pixels.length === 0) {
    return {
      ok: false,
      critique: 'Invalid output — missing OFFSET/GRID or no color letters. Return ONLY the OFFSET + GRID format.',
      rowSpan: 0,
      colSpan: 0,
      pixelCount: 0,
    };
  }

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

  const rowSpan = maxY - minY + 1;
  const colSpan = maxX - minX + 1;
  const minSpan = 3;

  if (rowSpan < minSpan || colSpan < minSpan) {
    return {
      ok: false,
      critique: `Too tiny — only ${rowSpan}×${colSpan}. Add a clear K outline so the subject reads.`,
      rowSpan,
      colSpan,
      pixelCount: pixels.length,
    };
  }

  if (pixels.length < 12) {
    return {
      ok: false,
      critique: `Too sparse — only ${pixels.length} filled pixels. Add a bold K outline and a bit more fill.`,
      rowSpan,
      colSpan,
      pixelCount: pixels.length,
    };
  }

  return { ok: true, critique: null, rowSpan, colSpan, pixelCount: pixels.length };
}
