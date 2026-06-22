/** ~1 in 20 doodles get a golden reveal shimmer (deterministic per drawing id). */

function hashDrawingId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const GOLDEN_DOODLE_MODULO = 20;

export function isGoldenDoodle(drawingId: string): boolean {
  if (!drawingId.trim()) return false;
  return hashDrawingId(drawingId) % GOLDEN_DOODLE_MODULO === 0;
}
