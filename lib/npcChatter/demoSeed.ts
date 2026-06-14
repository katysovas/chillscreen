/**
 * Internal QA — edit data/chatter-demo-seed.json.
 * Used only when `?debug=true` (see lib/chatterDebug.ts).
 */

import { isChatterDebugActive } from '@/lib/chatterDebug';
import demoSeedFile from '@/data/chatter-demo-seed.json';

const MAX_LEN = 300;

/** Seed line from JSON (ignores debug flag). */
export function demoSeedLine(): string | null {
  const trimmed = (demoSeedFile as { seed?: string }).seed?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_LEN);
}

/** Non-null when debug mode is on and JSON has a seed. */
export function activeDemoSeed(): string | null {
  if (!isChatterDebugActive()) return null;
  return demoSeedLine();
}
