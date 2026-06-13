export function notifyEaselUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('easel-updated'));
}
