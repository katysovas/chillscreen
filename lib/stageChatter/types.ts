import { stripNpcChatterDots } from '@/lib/messageFilter';

/** Public stage chatter line — persisted per room for up to 2 days. */
export type StageChatterMessage = {
  /** `user:{name}` or `npc:{id}` */
  sender: string;
  text: string;
  ts: number;
  /** Signed-in account id when the player was authenticated. */
  userId?: string;
};

export const STAGE_CHATTER_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;
export const STAGE_CHATTER_STORAGE_KEY = 'stage-chatter-v1';

/** Ground Score pickups — world bubble only, not stage chatter log. */
export function shouldExcludeFromStageChatter(sender: string, text: string): boolean {
  if (!sender.startsWith('user:')) return false;
  return /^Ground Score!\s+\d+\s+Coins!$/i.test(text.trim());
}

export function stageChatterKey(msg: Pick<StageChatterMessage, 'sender' | 'text' | 'ts'>): string {
  return `${msg.ts}\0${msg.sender}\0${msg.text}`;
}

/** NPC lines dedupe on sender + text — same NPC must not repeat an exact line in the log. */
export function stageChatterDedupKey(msg: Pick<StageChatterMessage, 'sender' | 'text'>): string {
  const text = msg.sender.startsWith('npc:')
    ? stripNpcChatterDots(msg.text)
    : msg.text.trim();
  return `${msg.sender}\0${text}`;
}

export function hasStageChatterLine(
  messages: StageChatterMessage[],
  sender: string,
  text: string,
): boolean {
  const key = stageChatterDedupKey({ sender, text });
  return messages.some(m => stageChatterDedupKey(m) === key);
}

export function pruneStageChatter(
  messages: StageChatterMessage[],
  now = Date.now(),
): StageChatterMessage[] {
  const cutoff = now - STAGE_CHATTER_RETENTION_MS;
  return messages.filter(m => m.ts >= cutoff);
}

export function mergeStageChatter(
  existing: StageChatterMessage[],
  incoming: StageChatterMessage[],
): StageChatterMessage[] {
  const seen = new Set(existing.map(stageChatterDedupKey));
  const merged = [...existing];
  for (const msg of incoming) {
    if (shouldExcludeFromStageChatter(msg.sender, msg.text)) continue;
    const normalized = msg.sender.startsWith('npc:')
      ? { ...msg, text: stripNpcChatterDots(msg.text) }
      : msg;
    const key = stageChatterDedupKey(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(normalized);
  }
  merged.sort((a, b) => a.ts - b.ts);
  return pruneStageChatter(merged);
}
