/** Per-tab spawn offset so new players don't stack on the same spot. */

const STORAGE_KEY = 'whichstage.spawnJitterPx';
const MAX_JITTER_PX = 280;

export function sessionSpawnJitterPx(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored != null) {
      const n = Number(stored);
      if (Number.isFinite(n)) return n;
    }
    const jitter = (Math.random() - 0.5) * 2 * MAX_JITTER_PX;
    sessionStorage.setItem(STORAGE_KEY, String(jitter));
    return jitter;
  } catch {
    return (Math.random() - 0.5) * 2 * MAX_JITTER_PX;
  }
}

export function spawnWorldXWithJitter(base: number): number {
  return base + sessionSpawnJitterPx();
}
