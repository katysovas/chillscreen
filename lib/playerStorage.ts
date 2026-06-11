'use client';

export {
  getOrCreatePlayerId,
  getPlayerName,
  setPlayerName,
} from '@/lib/player/session';

/** Letters and spaces only, 1–24 chars, no leading/trailing space runs. */
export function isValidPlayerName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1
    && trimmed.length <= 24
    && /^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(trimmed);
}

/** Strip digits and special characters as the user types. */
export function sanitizePlayerNameInput(value: string): string {
  return value.replace(/[^a-zA-Z\s]/g, '').slice(0, 24);
}
