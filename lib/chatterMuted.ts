/** `?mute=true` on page load — disable AI/NPC chatter and enable internal debug logs. */

let cached: boolean | null = null;

export function isChatterMuted(): boolean {
  if (typeof window === 'undefined') return false;
  if (cached === null) {
    cached = new URLSearchParams(window.location.search).get('mute') === 'true';
  }
  return cached;
}
