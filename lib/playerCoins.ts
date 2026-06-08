const STORAGE_KEY = 'whichstage-player-coins';

export const STARTING_COINS = 500;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function readPlayerCoins(): number | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function writePlayerCoins(coins: number): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(coins))));
}

/** Current balance — new players start at {@link STARTING_COINS}. */
export function getPlayerCoins(): number {
  const saved = readPlayerCoins();
  if (saved !== null) return saved;
  writePlayerCoins(STARTING_COINS);
  return STARTING_COINS;
}

/** Deduct coins if the balance is sufficient. Returns the new balance, or null. */
export function deductPlayerCoins(amount: number): number | null {
  if (amount <= 0) return getPlayerCoins();
  const balance = getPlayerCoins();
  if (balance < amount) return null;
  const next = balance - amount;
  writePlayerCoins(next);
  return next;
}
