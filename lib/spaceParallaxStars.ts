/** Viewport tile height for seamless vertical star drift loop. */
export const SPACE_PARALLAX_LOOP_PX = 2000;

const SPREAD = SPACE_PARALLAX_LOOP_PX;

/** Deterministic PRNG — stable star positions across builds/sessions. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pre-compute box-shadow star field (module load, zero per-frame cost). */
export function buildStarBoxShadow(count: number, seed: number): string {
  const rng = mulberry32(seed);
  const parts = new Array<string>(count);
  for (let i = 0; i < count; i++) {
    parts[i] = `${Math.floor(rng() * SPREAD)}px ${Math.floor(rng() * SPREAD)}px #fff`;
  }
  return parts.join(', ');
}

/** Desktop — fewer than classic demo (700/200/100) for paint budget. */
export const SPACE_PARALLAX_SHADOWS = {
  sm: buildStarBoxShadow(280, 0x51a7ce),
  md: buildStarBoxShadow(80, 0x8b2e19),
  lg: buildStarBoxShadow(40, 0xc4f03a),
} as const;

/** Mobile — drop large tier, thin small/medium fields. */
export const SPACE_PARALLAX_SHADOWS_MOBILE = {
  sm: buildStarBoxShadow(140, 0x51a7ce),
  md: buildStarBoxShadow(40, 0x8b2e19),
  lg: '',
} as const;
