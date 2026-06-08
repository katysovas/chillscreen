export const STAGE_TOILET = {
  src: '/images/toilet.png',
  width: 58,
  height: 72,
  gap: 2,
  count: 5,
  /** Sidewalk band — toilet bottoms align near y≈668. */
  sidewalkY: 596,
  /** Gap between stage edge and first unit. */
  edgePad: 16,
} as const;

export type StageToiletRow = {
  startX: number;
  y: number;
};

export function stageToiletStartX(
  centerX: number,
  stageHalfWidth: number,
  side: 'left' | 'right',
): number {
  const { width, gap, count, edgePad } = STAGE_TOILET;
  const span = count * width + (count - 1) * gap;
  return side === 'right'
    ? centerX + stageHalfWidth + edgePad
    : centerX - stageHalfWidth - edgePad - span;
}
