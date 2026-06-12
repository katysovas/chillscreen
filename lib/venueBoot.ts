import { VENUE_BOOT_OVERLAY_ID } from '@/lib/site';

/** Pin the boot splash for local CSS/layout work (`NEXT_PUBLIC_DEBUG_VENUE_BOOT=true` or `?debugBoot=1`). */
export function keepVenueBootOverlay(): boolean {
  if (process.env.NEXT_PUBLIC_DEBUG_VENUE_BOOT === 'true') return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('debugBoot');
}

/** Fade out the SSR venue boot overlay once the game is ready. DOM stays in React's tree — never call remove() here. */
export function hideVenueBootOverlay(): void {
  if (keepVenueBootOverlay()) return;
  if (typeof document === 'undefined') return;
  const el = document.getElementById(VENUE_BOOT_OVERLAY_ID);
  if (!el || el.classList.contains('venue-boot-overlay--hide')) return;
  el.classList.add('venue-boot-overlay--hide');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('aria-busy', 'false');
}
