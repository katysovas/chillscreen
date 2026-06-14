import { FESTIE_CONFIG, festieTier } from '@/lib/festie/config';
import { listFestiesDueForOfflineNpcChat } from '@/lib/festie/db';
import { generateOneOfflineFestieNpcChat } from '@/lib/festie/offlineNpcChatter';

export type OfflineChatterCronResult = {
  checked: number;
  generated: number;
  skipped: number;
};

/** Process festies due for an ambient NPC chat (max per run to stay within cron timeout). */
export async function runOfflineFestieChatterCron(
  limit = 5,
): Promise<OfflineChatterCronResult> {
  const due = await listFestiesDueForOfflineNpcChat(limit);
  let generated = 0;
  let skipped = 0;

  for (const festie of due) {
    if (festieTier(new Date(festie.last_seen_at)) !== 'live') {
      skipped++;
      continue;
    }

    const ok = await generateOneOfflineFestieNpcChat(festie);
    if (ok) generated++;
    else skipped++;
  }

  return { checked: due.length, generated, skipped };
}

export function offlineChatterIntervalHours(): number {
  return FESTIE_CONFIG.OFFLINE_CHAT_INTERVAL_MS / (60 * 60 * 1000);
}
