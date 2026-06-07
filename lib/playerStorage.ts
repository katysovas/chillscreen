const KEY = 'whichstage:playerName';
const LEGACY_KEY = 'cs:playerName';

export function getPlayerName(): string | null {
  if (typeof window === 'undefined') return null;
  const current = localStorage.getItem(KEY);
  if (current !== null) return current;
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy !== null) {
    localStorage.setItem(KEY, legacy);
    localStorage.removeItem(LEGACY_KEY);
    return legacy;
  }
  return null;
}

export function setPlayerName(name: string) {
  localStorage.setItem(KEY, name.trim());
  localStorage.removeItem(LEGACY_KEY);
}

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
