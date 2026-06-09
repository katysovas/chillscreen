const STORAGE_KEY = 'whichstage-player-coins';

export const STARTING_COINS = 300;

// ── Tamper-discouraging encoding ───────────────────────────────────────────
// NOT real security (the secret ships in the bundle) — just enough that a
// casual localStorage edit invalidates the checksum and resets the wallet.
const COIN_SALT = 'ws-coin-v1:9f4b';

function checksum(value: number): string {
  const s = `${COIN_SALT}:${value}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function encodeCoins(value: number): string {
  return `v1.${value.toString(36)}.${checksum(value)}`;
}

function decodeCoins(raw: string): number | null {
  const m = /^v1\.([0-9a-z]+)\.([0-9a-z]+)$/.exec(raw);
  if (!m) return null;
  const value = parseInt(m[1]!, 36);
  if (!Number.isFinite(value) || value < 0) return null;
  return checksum(value) === m[2] ? value : null;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function readPlayerCoins(): number | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    // Legacy plain-number balances migrate to the encoded format.
    if (/^\d+$/.test(raw)) {
      const legacy = parseInt(raw, 10);
      if (Number.isFinite(legacy)) {
        writePlayerCoins(legacy);
        return Math.max(0, legacy);
      }
      return null;
    }
    // Invalid/tampered values read as null → wallet resets to STARTING_COINS.
    return decodeCoins(raw);
  } catch {
    return null;
  }
}

export function writePlayerCoins(coins: number): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, encodeCoins(Math.max(0, Math.floor(coins))));
}

/** Current balance — new players start at {@link STARTING_COINS}. */
export function getPlayerCoins(): number {
  const saved = readPlayerCoins();
  if (saved !== null) return saved;
  writePlayerCoins(STARTING_COINS);
  return STARTING_COINS;
}

/** Add coins (e.g. Ground Score pickups). Returns the new balance. */
export function addPlayerCoins(amount: number): number {
  const next = getPlayerCoins() + Math.max(0, Math.floor(amount));
  writePlayerCoins(next);
  return next;
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
