'use client';

import { GUEST_NAME_KEY } from '@/lib/player/constants';
import { getOrCreatePlayerId, getPlayerName, setPlayerName } from '@/lib/player/session';

const GUEST_FIRST_NAMES = [
  'maya', 'derek', 'priya', 'sam', 'jess', 'marcus', 'tina', 'alex', 'nina',
  'jordan', 'riley', 'casey', 'dev', 'luna', 'omar', 'zoe', 'eli', 'sage',
  'noah', 'mia', 'leo', 'ava', 'kai', 'ruby', 'finn', 'cleo', 'theo', 'iris',
] as const;

function readStoredGuestName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GUEST_NAME_KEY)?.trim();
    return raw && raw.length >= 1 && raw.length <= 24 ? raw : null;
  } catch {
    return null;
  }
}

function writeStoredGuestName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_NAME_KEY, name);
  } catch {
    // ignore quota / private mode
  }
}

function capitalizeName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Pick a random guest display name (first name, capitalized). */
export function pickRandomGuestName(): string {
  const pick = GUEST_FIRST_NAMES[Math.floor(Math.random() * GUEST_FIRST_NAMES.length)]!;
  return capitalizeName(pick);
}

/**
 * Ensure an anonymous guest has a stable display name for this browser.
 * Reuses session name, localStorage, or assigns a new random name.
 */
export function ensureGuestName(): string {
  const existing = getPlayerName()?.trim() || readStoredGuestName();
  if (existing) {
    setPlayerName(existing);
    writeStoredGuestName(existing);
    return existing;
  }

  // Stable per guest id so reloads keep the same random name.
  getOrCreatePlayerId();
  const name = pickRandomGuestName();
  setPlayerName(name);
  writeStoredGuestName(name);
  return name;
}
