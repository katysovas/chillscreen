import sharp from 'sharp';
import type { DoodleGridFile } from './types';
import { DOODLE_TRANSPARENT } from './types';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h.padStart(6, '0').slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0]! - b[0]!;
  const dg = a[1]! - b[1]!;
  const db = a[2]! - b[2]!;
  return dr * dr + dg * dg + db * db;
}

function nearestPaletteIndex(
  rgb: [number, number, number],
  palette: string[],
): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const d = colorDistance(rgb, hexToRgb(palette[i]!));
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function matchesBg(rgb: [number, number, number], bgHex: string, tolerance = 28): boolean {
  const bg = hexToRgb(bgHex);
  return colorDistance(rgb, bg) <= tolerance * tolerance;
}

/** Flood from corners to find background-connected bbox of foreground. */
function findForegroundBounds(
  data: Uint8Array,
  w: number,
  h: number,
  bgHex: string,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];
  const corners = [0, w - 1, (h - 1) * w, w * h - 1];
  for (const idx of corners) {
    const x = idx % w;
    const y = Math.floor(idx / w);
    const off = idx * 4;
    const rgb: [number, number, number] = [data[off]!, data[off + 1]!, data[off + 2]!];
    if (matchesBg(rgb, bgHex)) {
      visited[idx] = 1;
      queue.push(idx);
    }
  }

  while (queue.length > 0) {
    const idx = queue.pop()!;
    const x = idx % w;
    const y = Math.floor(idx / w);
    const neighbors = [
      x > 0 ? idx - 1 : -1,
      x < w - 1 ? idx + 1 : -1,
      y > 0 ? idx - w : -1,
      y < h - 1 ? idx + w : -1,
    ];
    for (const n of neighbors) {
      if (n < 0 || visited[n]) continue;
      const off = n * 4;
      const rgb: [number, number, number] = [data[off]!, data[off + 1]!, data[off + 2]!];
      if (matchesBg(rgb, bgHex)) {
        visited[n] = 1;
        queue.push(n);
      }
    }
  }

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx]) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
}

export type QuantizeOptions = {
  palette: string[];
  bgHex: string;
  gridW: number;
  gridH: number;
};

export type QuantizeResult = {
  grid: DoodleGridFile;
  spritePng: Buffer;
};

/** Downscale raster → palette-quantized index grid + upscaled sprite PNG. */
export async function quantizeRasterToGrid(
  input: Buffer,
  opts: QuantizeOptions,
): Promise<QuantizeResult | null> {
  const { palette, bgHex, gridW, gridH } = opts;
  const base = sharp(input).ensureAlpha();
  const meta = await base.metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  if (srcW < 8 || srcH < 8) return null;

  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const bounds = findForegroundBounds(data, info.width, info.height, bgHex);
  if (!bounds) return null;

  const pad = 2;
  const cropLeft = Math.max(0, bounds.minX - pad);
  const cropTop = Math.max(0, bounds.minY - pad);
  const cropWidth = Math.min(info.width - cropLeft, bounds.maxX - bounds.minX + 1 + pad * 2);
  const cropHeight = Math.min(info.height - cropTop, bounds.maxY - bounds.minY + 1 + pad * 2);

  const cropped = await sharp(input)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(gridW, gridH, { kernel: sharp.kernel.cubic, fit: 'contain', background: bgHex })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rows: number[][] = [];
  let filled = 0;
  for (let y = 0; y < gridH; y++) {
    const row: number[] = [];
    for (let x = 0; x < gridW; x++) {
      const off = (y * gridW + x) * cropped.info.channels;
      const rgb: [number, number, number] = [
        cropped.data[off]!,
        cropped.data[off + 1]!,
        cropped.data[off + 2]!,
      ];
      if (matchesBg(rgb, bgHex)) {
        row.push(DOODLE_TRANSPARENT);
      } else {
        row.push(nearestPaletteIndex(rgb, palette));
        filled++;
      }
    }
    rows.push(row);
  }

  if (filled < 4) return null;

  const unique = new Set(rows.flat().filter(v => v !== DOODLE_TRANSPARENT));
  if (unique.size < 2) return null;

  const grid: DoodleGridFile = { w: gridW, h: gridH, palette, bgHex, rows };
  const spritePng = await renderGridToSpritePng(grid, 4);
  return { grid, spritePng };
}

/** Nearest-neighbor upscale for easel preview / QC. */
export async function renderGridToSpritePng(
  grid: DoodleGridFile,
  scale = 4,
): Promise<Buffer> {
  const outW = grid.w * scale;
  const outH = grid.h * scale;
  const rgba = Buffer.alloc(outW * outH * 4, 0);

  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      const idx = grid.rows[y]![x]!;
      if (idx === DOODLE_TRANSPARENT) continue;
      const hex = grid.palette[idx] ?? '#000000';
      const [r, g, b] = hexToRgb(hex);
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = x * scale + sx;
          const py = y * scale + sy;
          const off = (py * outW + px) * 4;
          rgba[off] = r;
          rgba[off + 1] = g;
          rgba[off + 2] = b;
          rgba[off + 3] = 255;
        }
      }
    }
  }

  return sharp(rgba, { raw: { width: outW, height: outH, channels: 4 } })
    .png()
    .toBuffer();
}

export function validateGrid(grid: DoodleGridFile): boolean {
  if (grid.w < 8 || grid.h < 8 || grid.w > 32 || grid.h > 32) return false;
  if (grid.rows.length !== grid.h) return false;
  for (const row of grid.rows) {
    if (row.length !== grid.w) return false;
    for (const cell of row) {
      if (cell === DOODLE_TRANSPARENT) continue;
      if (!Number.isInteger(cell) || cell < 0 || cell >= grid.palette.length) return false;
    }
  }
  const filled = grid.rows.flat().filter(c => c !== DOODLE_TRANSPARENT);
  if (filled.length < 4) return false;
  if (new Set(filled).size < 2) return false;
  return true;
}
