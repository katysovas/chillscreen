/** Live camera offset — same space as ground scroll (GND_F = 1). Updated every game frame. */
export const gameWorldOffRef = { current: 0 };

let cameraSeeded = false;

/** Seed camera before stage iframes mount (once per venue load). */
export function initGameCameraOnce(worldOff: number): void {
  if (cameraSeeded) return;
  gameWorldOffRef.current = worldOff;
  cameraSeeded = true;
}

export function resetGameCameraSeed(): void {
  cameraSeeded = false;
}

export function worldXToScreenPct(worldX: number, worldOff: number, width = typeof window !== 'undefined' ? window.innerWidth : 1200) {
  return 50 + ((worldX - worldOff) / width) * 100;
}

export function screenPctToWorldX(pct: number, worldOff: number, width = typeof window !== 'undefined' ? window.innerWidth : 1200) {
  return worldOff + ((pct - 50) / 100) * width;
}
