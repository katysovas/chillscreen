const PREFIX = 'festie_recap_ack_';

function key(festieId: string): string {
  return `${PREFIX}${festieId}`;
}

/** Last away-period start (`since`) the user already saw or dismissed. */
export function wasSessionRecapAcked(festieId: string, since: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(key(festieId)) === since;
  } catch {
    return false;
  }
}

export function markSessionRecapAcked(festieId: string, since: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key(festieId), since);
  } catch {
    /* quota / private mode */
  }
}
