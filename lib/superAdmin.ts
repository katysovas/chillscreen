/** In-game super admin — festie display name (case-insensitive). */
export const SUPER_ADMIN_FESTIE_NAME = 'HuskyNights';

/** Minimum wallet balance while testing the vendor shop as super admin. */
export const SUPER_ADMIN_TEST_COINS = 10_000;

export function isSuperAdminFestieName(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  return name.trim().toLowerCase() === SUPER_ADMIN_FESTIE_NAME.toLowerCase();
}

/**
 * Secret rule — HuskyNights can stack matchup votes (keep or swap) without the
 * one-vote-per-account cap. Each tap gets a unique voter id so weight accumulates.
 */
export function superAdminMatchupVoterId(userId: string, ts: number, nonce?: number): string {
  const base = `${userId.trim()}:sa:${ts}`;
  return nonce != null ? `${base}:${nonce}` : base;
}

export function isSuperAdminMatchupVoterId(voterId: string): boolean {
  return /^[0-9a-f-]{36}:sa:\d+(:\d+)?$/i.test(voterId.trim());
}

export function isValidLineupVoterId(voterId: string): boolean {
  const id = voterId.trim();
  if (!id) return false;
  if (isSuperAdminMatchupVoterId(id)) return true;
  if (id.startsWith('conn:')) return true;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
