import type { EaselSlotSync } from '@/lib/easel/types';

export async function claimAutopilotEasel(
  stage: string,
): Promise<EaselSlotSync | null> {
  try {
    const res = await fetch('/api/easel/autopilot-claim', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { ok?: boolean; slot?: EaselSlotSync };
    return data.ok && data.slot ? data.slot : null;
  } catch {
    return null;
  }
}
