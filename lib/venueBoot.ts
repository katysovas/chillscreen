import { VENUE_BOOT_OVERLAY_ID } from '@/lib/site';

const FADE_MS = 320;

/** Fade out and remove the SSR venue boot overlay once the game is ready. */
export function hideVenueBootOverlay(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(VENUE_BOOT_OVERLAY_ID);
  if (!el) return;
  el.classList.add('venue-boot-overlay--hide');
  window.setTimeout(() => el.remove(), FADE_MS);
}
