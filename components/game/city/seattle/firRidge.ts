import { SEATTLE_TILE_W } from './constants';

/** Jagged evergreen tree-line ridge as a single path string. */
export function firRidge(yTop: number, yBase: number, amp: number, step: number, seed: number): string {
  let d = `M0,${yBase} L0,${yTop}`;
  for (let x = 0; x <= SEATTLE_TILE_W; x += step) {
    const j = ((x / step + seed) % 3) * (amp * 0.28);
    d += ` L${x + step / 2},${yTop - amp - j} L${x + step},${yTop}`;
  }
  return `${d} L${SEATTLE_TILE_W},${yBase} Z`;
}
