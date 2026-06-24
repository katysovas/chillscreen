/** Desktop Safari — WebKit without Chromium/Firefox/Edge. */
export function isSafariBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/(Chrome|Chromium|CriOS|Edg|OPR|Firefox)/i.test(ua);
}
