import { mobileLawnHeightPx, mobileOrbitBandHeightPx } from '@/lib/mobileVenueLayout';

/** CSS bottom offset — feet align with the ground-layer sidewalk (GND ≈ 76% in viewBox). */
export const CHAR_BOTTOM = '11%';

/** Pair-chat column sits above NPC heads (feet at CHAR_BOTTOM, scale ≈ 0.34). */
export const NPC_PAIR_CHAT_LIFT_PX = 98;

/** Mobile lounge override — applied via `.game-character` in globals.css. */
export const CHAR_BOTTOM_MOBILE_LOUNGE = '20%';

function hashSeed(seed: number | string): number {
  if (typeof seed === 'number') return Math.abs(seed);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export type CrowdDepthOptions = {
  /** Index in the visible crowd — spreads NPCs evenly on mobile. */
  crowdIndex?: number;
  crowdTotal?: number;
  /** Deep Space — float band below the orbit stage instead of grass lawn. */
  orbitFloat?: boolean;
};

/**
 * Stable sidewalk depth offset (px) from a character id or index.
 * Three depth rows at 0 / 50 / 100px (positive = lower on screen).
 */
export function crowdDepthOffsetPx(seed: number | string): number {
  const h = hashSeed(seed);
  const tier = h % 3;
  return tier * 50;
}

/** Crowd z-index range — lower on screen (larger depthY) renders on top. */
export const CROWD_Z_MIN = 18;
export const CROWD_Z_MAX = 20;

/** Mobile — wider z spread so overlapping rows stack predictably. */
export const MOBILE_CROWD_Z_MAX = 28;

/** z-index for crowd characters — lower on screen (larger depthY) stacks above. */
export function crowdDepthZIndex(depthY: number): number {
  return CROWD_Z_MIN + Math.min(2, Math.round(depthY / 50));
}

function spreadDepthInBand(
  seed: number | string,
  bandPx: number,
  crowdIndex?: number,
  crowdTotal?: number,
): number {
  const marginFront = bandPx * 0.05;
  const marginBack = bandPx * 0.04;
  const usable = Math.max(40, bandPx - marginFront - marginBack);

  if (crowdIndex != null && crowdTotal != null && crowdTotal > 1) {
    const baseFrac = crowdIndex / (crowdTotal - 1);
    const jitter = (((hashSeed(seed) % 180) - 90) / 90) * (usable * 0.07);
    return Math.round(marginFront + baseFrac * usable + jitter);
  }

  const frac = (hashSeed(seed) % 1000) / 1000;
  return Math.round(marginFront + frac * usable);
}

function mobileCrowdDepthZIndex(depthY: number, bandPx: number): number {
  const frac = Math.min(1, Math.max(0, depthY / Math.max(1, bandPx)));
  return CROWD_Z_MIN + Math.round(frac * (MOBILE_CROWD_Z_MAX - CROWD_Z_MIN));
}

export function crowdDepthForSeed(
  seed: number | string,
  options: CrowdDepthOptions = {},
): { depthY: number; depthZ: number } {
  if (typeof window !== 'undefined' && window.innerWidth <= 767) {
    const bandPx = options.orbitFloat
      ? mobileOrbitBandHeightPx()
      : mobileLawnHeightPx();
    const depthY = spreadDepthInBand(
      seed,
      bandPx,
      options.crowdIndex,
      options.crowdTotal,
    );
    return { depthY, depthZ: mobileCrowdDepthZIndex(depthY, bandPx) };
  }
  const depthY = crowdDepthOffsetPx(seed);
  return { depthY, depthZ: crowdDepthZIndex(depthY) };
}
