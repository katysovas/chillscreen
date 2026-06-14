import { isChatterMuted } from './chatterMuted';

/** Request header — browser sends when `?mute=true` for server-side debug logs. */
export const INTERNAL_DEBUG_HEADER = 'x-internal-debug';

let serverDebugActive = false;

export function internalDebugFromRequest(req: Request): boolean {
  return req.headers.get(INTERNAL_DEBUG_HEADER) === 'true';
}

/** Enable server-side debug logging for the duration of an API handler. */
export function runWithInternalDebug<T>(active: boolean, fn: () => T): T {
  const prev = serverDebugActive;
  serverDebugActive = active || prev;
  try {
    return fn();
  } finally {
    serverDebugActive = prev;
  }
}

/** True when `?mute=true` (browser) or request/party has internal debug on. */
export function isInternalDebugActive(): boolean {
  if (typeof window !== 'undefined') return isChatterMuted();
  return serverDebugActive;
}

export function ilog(...args: unknown[]): void {
  if (!isInternalDebugActive()) return;
  console.log(...args);
}

export function iwarn(...args: unknown[]): void {
  if (!isInternalDebugActive()) return;
  console.warn(...args);
}

export function ierror(...args: unknown[]): void {
  if (!isInternalDebugActive()) return;
  console.error(...args);
}

/** Extra headers for fetch calls when internal debug is enabled. */
export function internalDebugFetchHeaders(): Record<string, string> {
  if (typeof window === 'undefined' || !isChatterMuted()) return {};
  return { [INTERNAL_DEBUG_HEADER]: 'true' };
}
