/** Challenger share above 50% wins the slot at track boundary (ties keep the holder). */
export const SWAP_THRESHOLD = 0.5;

/** Phantom electorate parked at center — washes out as real votes accumulate. */
export const BASELINE = 20;

/** Vote weight half-life — stalled rallies drift back to center. */
export const HALF_LIFE_MS = 4 * 60 * 60 * 1000;

/** Cooldown ring depth for autoplay picks. */
export const RECENTLY_PLAYED_SIZE = 15;

/** Debounce next-playing badge flicker at the threshold line. */
export const BADGE_DEBOUNCE_MS = 1500;
