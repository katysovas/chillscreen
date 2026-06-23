/** Challenger share 0–1 → display percents for the poll bar + needle. */
export function matchupDisplayPercents(shareB: number | undefined | null): {
  pctA: number;
  pctB: number;
  needlePct: number;
} {
  const safe = typeof shareB === 'number' && Number.isFinite(shareB)
    ? Math.max(0, Math.min(1, shareB))
    : 0.5;
  const pctB = Math.round(safe * 100);
  const pctA = 100 - pctB;
  return { pctA, pctB, needlePct: pctB };
}
