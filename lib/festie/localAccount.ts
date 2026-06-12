/** Remember that this browser has a festie account — default auth modal to sign-in. */

const ACCOUNT_KEY = 'festie_has_account';
const NAME_KEY = 'festie_account_name';

export function hasLocalFestieAccount(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ACCOUNT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getLocalFestieName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const name = localStorage.getItem(NAME_KEY);
    return name?.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

export function markLocalFestieAccount(name: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(ACCOUNT_KEY, 'true');
    localStorage.setItem(NAME_KEY, trimmed);
  } catch {
    /* ignore */
  }
}
