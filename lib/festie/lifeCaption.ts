import { festieTier } from '@/lib/festie/config';

export function festieLifeCaption(
  ownerOnline: boolean,
  lastSeenAt: string,
  refillFrom: number | null = null,
): string {
  const tier = festieTier(new Date(lastSeenAt));
  if (ownerOnline) return 'with you now';
  if (refillFrom != null && refillFrom < 0.95) return 'recharged by your visit';
  if (tier === 'dim') return 'napping';
  return 'out at the festival';
}
