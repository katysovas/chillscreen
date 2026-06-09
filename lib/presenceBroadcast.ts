/** Match mobile game controls breakpoint — coarse / narrow viewports. */
export function isMobilePresenceViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

/** Game-loop frames between PartyKit move broadcasts (~15 Hz desktop, ~7.5 Hz mobile). */
export function moveBroadcastFrameInterval(): number {
  return isMobilePresenceViewport() ? 8 : 4;
}

/** Min world-x delta before a move packet is worth sending. */
export function moveBroadcastWorldEpsilon(): number {
  return isMobilePresenceViewport() ? 4 : 1;
}
