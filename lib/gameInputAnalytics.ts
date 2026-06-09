import { captureEvent } from '@/lib/analytics';

const MOBILE_MQ = '(max-width: 767px)';

/** Keys the game reacts to — mirrors SFCity keyboard handling. */
const GAME_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Enter', 'Escape', ' ',
  'a', 'A', 'd', 'D', 'w', 'W',
]);

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

function targetTag(e: KeyboardEvent): string {
  const el = e.target;
  if (!(el instanceof HTMLElement)) return 'window';
  return el.tagName.toLowerCase();
}

function shouldTrackKeydown(e: KeyboardEvent): boolean {
  if (e.repeat) return false;
  const tag = targetTag(e);
  if (tag === 'input' || tag === 'textarea') {
    return e.key === 'Enter' || e.key === 'Escape';
  }
  return GAME_KEYS.has(e.key);
}

/** Physical keyboard — runs before game handlers (capture phase). */
export function trackGameKeydown(e: KeyboardEvent) {
  if (!shouldTrackKeydown(e)) return;
  captureEvent('game_key', {
    phase: 'down',
    key: e.key,
    code: e.code,
    target: targetTag(e),
    mobile: isMobileViewport(),
  });
}

/** Touch / on-screen controls that replace keyboard shortcuts on mobile. */
export function trackMobileControl(control: string) {
  captureEvent('game_key', {
    phase: 'control',
    key: control,
    mobile: true,
  });
}

let installed = false;

/** One global listener — autocapture is off so we track game keys manually. */
export function installGameInputAnalytics() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('keydown', trackGameKeydown, true);
}
