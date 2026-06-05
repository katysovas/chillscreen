/**
 * Per-session player identity. No accounts, no storage — a random balloon
 * color is picked once on the client and kept for the tab's lifetime so the
 * local avatar and the networked copy other players see always match.
 */

const BALLOON_COLORS = [
  '#ef4023', // classic red
  '#4a8fe8', // sky blue
  '#6abf69', // leaf green
  '#b06be0', // violet
  '#f07828', // sports orange
  '#e04f8e', // magenta
  '#e8c830', // gold
  '#2bb8a3', // teal
  '#f25c54', // coral
  '#7c9eb2', // slate
  '#ff9ec4', // bubblegum
  '#9ad34b', // lime
];

let cachedColor: string | undefined;

export function randomBalloonColor(): string {
  return BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]!;
}

/** Stable random balloon color for this session (client snapshot). */
export function getSessionBalloonColor(): string {
  if (cachedColor === undefined) cachedColor = randomBalloonColor();
  return cachedColor;
}

/** Deterministic color for SSR / hydration (matches the pre-random default). */
export function getServerBalloonColor(): string {
  return '#ef4023';
}

/** No-op subscription — the session color never changes once picked. */
export function subscribeBalloonColor() {
  return () => {};
}
