import { VENUE_BOOT_OVERLAY_ID } from '@/lib/site';

/** Env-only check — safe during SSR and the first client render. */
export function keepVenueBootOverlayFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_DEBUG_VENUE_BOOT === 'true';
}

/** Pin the boot splash for local CSS/layout work (`NEXT_PUBLIC_DEBUG_VENUE_BOOT=true` or `?debugBoot=1`). */
export function keepVenueBootOverlay(): boolean {
  if (keepVenueBootOverlayFromEnv()) return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('debugBoot');
}

type BootOverlayListener = () => void;

let bootOverlayHidden = false;
const bootOverlayListeners = new Set<BootOverlayListener>();

function emitBootOverlayChange(): void {
  for (const listener of bootOverlayListeners) listener();
}

export function subscribeVenueBootOverlayHidden(listener: BootOverlayListener): () => void {
  bootOverlayListeners.add(listener);
  return () => bootOverlayListeners.delete(listener);
}

/** Client snapshot — hidden after the game is ready. */
export function isVenueBootOverlayHidden(): boolean {
  return bootOverlayHidden;
}

/** SSR / first client paint — always visible until hideVenueBootOverlay runs. */
export function isVenueBootOverlayHiddenOnServer(): boolean {
  return false;
}

/** Fade out the SSR venue boot overlay once the game is ready (React state, not DOM surgery). */
export function hideVenueBootOverlay(): void {
  if (keepVenueBootOverlay()) return;
  if (bootOverlayHidden) return;
  bootOverlayHidden = true;
  emitBootOverlayChange();
}

export { VENUE_BOOT_OVERLAY_ID };
