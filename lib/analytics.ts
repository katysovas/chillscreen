import posthog from 'posthog-js';
import { getOrCreatePlayerId } from '@/lib/playerStorage';

/** Link an anonymous id to the chosen display name. */
export function identifyPlayer(name: string) {
  if (typeof window === 'undefined') return;
  posthog.identify(getOrCreatePlayerId(), { name });
}

/** First-time character creation — welcome flow submit. */
export function trackCharacterCreated(name: string) {
  if (typeof window === 'undefined') return;
  const id = getOrCreatePlayerId();
  posthog.identify(id, { name });
  posthog.capture('character_created', { name });
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
}
