/** `?debug=true` — internal QA: demo seed only, hide bottom controls, extra logs. */

export const CHATTER_DEBUG_HEADER = 'x-chatter-debug';

let cachedDebugMode: boolean | null = null;
let serverChatterDebugActive = false;

/** Browser: `?debug=true` on page load. */
export function isChatterDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  if (cachedDebugMode === null) {
    cachedDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
  }
  return cachedDebugMode;
}

export function chatterDebugFromRequest(req: Request): boolean {
  return req.headers.get(CHATTER_DEBUG_HEADER) === 'true';
}

/** Enable demo-seed mode for the duration of a server handler (API / PartyKit). */
export function runWithChatterDebug<T>(active: boolean, fn: () => T): T {
  const prev = serverChatterDebugActive;
  serverChatterDebugActive = active || prev;
  try {
    return fn();
  } finally {
    serverChatterDebugActive = prev;
  }
}

/** True when `?debug=true` (browser) or `x-chatter-debug` header (server). */
export function isChatterDebugActive(): boolean {
  if (typeof window !== 'undefined') return isChatterDebugMode();
  return serverChatterDebugActive;
}

/** Extra headers for fetch calls when `?debug=true`. */
export function chatterDebugFetchHeaders(): Record<string, string> {
  if (typeof window === 'undefined' || !isChatterDebugMode()) return {};
  return { [CHATTER_DEBUG_HEADER]: 'true' };
}
