/** Run `fn` on idle time, with a hard timeout fallback when idle never fires. */
export function scheduleIdleCallback(
  fn: () => void,
  options?: { timeout?: number },
): () => void {
  const timeout = options?.timeout ?? 4_000;
  if (typeof window === 'undefined') return () => {};

  let cancelled = false;
  const run = () => {
    if (!cancelled) fn();
  };

  let idleId: number | undefined;
  if (typeof window.requestIdleCallback === 'function') {
    idleId = window.requestIdleCallback(run, { timeout });
  }
  const timeoutId = window.setTimeout(run, timeout);

  return () => {
    cancelled = true;
    if (idleId != null) window.cancelIdleCallback(idleId);
    window.clearTimeout(timeoutId);
  };
}
