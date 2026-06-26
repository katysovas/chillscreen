/** Safari (and some extensions) reject promises with raw Event / CustomEvent values. */
export function isEventLikeRejection(reason: unknown): boolean {
  if (reason instanceof Event) return true;
  if (typeof reason !== 'object' || reason === null) return false;
  return 'type' in reason && 'target' in reason;
}

let installed = false;

/**
 * Block Next.js dev terminal forwarding for benign Event rejections.
 * Must run from instrumentation-client.ts before other client boot code.
 */
export function installSafariEventRejectionFilter(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener(
    'unhandledrejection',
    event => {
      if (!isEventLikeRejection(event.reason)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    { capture: true },
  );
}
