import { screenPctToWorldX, worldXToScreenPct } from '@/lib/gameWorldRef';

const DESKTOP_MIN_WIDTH = 768;
const PANEL_MAX_PX = 560;
const PANEL_MAX_VW = 0.96;
/** Extra clearance beyond the pill edges so feet don't sit on the panel. */
const BAND_MARGIN_PCT = 3;

function rndBetween(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

/** Screen-x band covered by BottomControlPanel on desktop, or null on mobile. */
export function desktopBottomControlsBand(viewportWidth: number): [number, number] | null {
  if (viewportWidth < DESKTOP_MIN_WIDTH) return null;
  const panelW = Math.min(viewportWidth * PANEL_MAX_VW, PANEL_MAX_PX);
  const halfPct = (panelW / viewportWidth) * 50;
  return [50 - halfPct - BAND_MARGIN_PCT, 50 + halfPct + BAND_MARGIN_PCT];
}

export function isInDesktopBottomControlsBand(pct: number, viewportWidth: number): boolean {
  const band = desktopBottomControlsBand(viewportWidth);
  if (!band) return false;
  return pct >= band[0] && pct <= band[1];
}

export function nudgeScreenPctAwayFromDesktopControls(pct: number, viewportWidth: number): number {
  const band = desktopBottomControlsBand(viewportWidth);
  if (!band) return pct;
  const [exLo, exHi] = band;
  if (pct < exLo || pct > exHi) return pct;
  const mid = (exLo + exHi) / 2;
  return pct <= mid ? exLo - 1 : exHi + 1;
}

export function nudgeWorldXAwayFromDesktopControls(
  worldX: number,
  worldOff: number,
  viewportWidth: number,
): number {
  const pct = worldXToScreenPct(worldX, worldOff, viewportWidth);
  const nudged = nudgeScreenPctAwayFromDesktopControls(pct, viewportWidth);
  if (nudged === pct) return worldX;
  return screenPctToWorldX(nudged, worldOff, viewportWidth);
}

/** Random screen-x in [lo, hi], skipping the desktop bottom-controls band when present. */
export function rndScreenPctAvoidDesktopControls(
  lo: number,
  hi: number,
  viewportWidth: number,
): number {
  const band = desktopBottomControlsBand(viewportWidth);
  if (!band) return rndBetween(lo, hi);

  const [exLo, exHi] = band;
  const segments: [number, number][] = [];
  if (lo < exLo) segments.push([lo, Math.min(hi, exLo)]);
  if (hi > exHi) segments.push([Math.max(lo, exHi), hi]);

  if (segments.length === 0) {
    return Math.random() < 0.5
      ? rndBetween(lo, exLo)
      : rndBetween(exHi, hi);
  }

  const total = segments.reduce((sum, [a, b]) => sum + (b - a), 0);
  if (total <= 0) return rndBetween(lo, hi);

  let pick = Math.random() * total;
  for (const [a, b] of segments) {
    const len = b - a;
    if (pick <= len) return a + pick;
    pick -= len;
  }
  return segments[segments.length - 1]![1];
}
