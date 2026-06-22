/** True when `?freshEasel=1` is in the URL (dev-only easel reset). */
export function freshEaselFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NODE_ENV !== 'development') return false;
  return new URLSearchParams(window.location.search).get('freshEasel') === '1';
}
