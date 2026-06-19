import type * as Party from 'partykit/server';
import { stripNpcChatterDots } from '../lib/messageFilter';
import {
  mergeStageChatter,
  pruneStageChatter,
  STAGE_CHATTER_STORAGE_KEY,
  type StageChatterMessage,
} from '../lib/stageChatter/types';

/** Durable per-room stage chatter — survives empty rooms for up to 2 days. */
export class StageChatterStore {
  private cache: StageChatterMessage[] | null = null;

  constructor(private readonly storage: Party.Room['storage']) {}

  async load(): Promise<StageChatterMessage[]> {
    if (this.cache) return this.cache;
    const stored = await this.storage.get<StageChatterMessage[]>(STAGE_CHATTER_STORAGE_KEY);
    const normalized = (stored ?? []).map(m => (
      m.sender.startsWith('npc:')
        ? { ...m, text: stripNpcChatterDots(m.text) }
        : m
    ));
    const pruned = mergeStageChatter([], pruneStageChatter(normalized));
    this.cache = pruned;
    if (pruned.length !== (stored?.length ?? 0)
      || normalized.some((m, i) => m.text !== stored?.[i]?.text)) {
      void this.storage.put(STAGE_CHATTER_STORAGE_KEY, pruned);
    }
    return pruned;
  }

  async append(
    sender: string,
    text: string,
    ts = Date.now(),
    userId?: string | null,
  ): Promise<{ entry: StageChatterMessage; added: boolean }> {
    const cleaned = sender.startsWith('npc:') ? stripNpcChatterDots(text) : text;
    const entry: StageChatterMessage = {
      sender,
      text: cleaned,
      ts,
      ...(userId ? { userId } : {}),
    };
    const history = await this.load();
    const merged = mergeStageChatter(history, [entry]);
    const added = merged.length > history.length;
    this.cache = merged;
    if (added) {
      void this.storage.put(STAGE_CHATTER_STORAGE_KEY, merged);
    }
    const stored = added
      ? merged[merged.length - 1]!
      : merged.find(m => m.sender === sender && m.text === cleaned) ?? entry;
    return { entry: stored, added };
  }

  /** Remove all lines from one or more senders (`user:{name}` or `npc:{id}`). */
  async removeSenders(senders: string[]): Promise<{
    removed: number;
    remaining: StageChatterMessage[];
  }> {
    const targets = new Set(senders.map(s => s.trim().toLowerCase()).filter(Boolean));
    const history = await this.load();
    const remaining = history.filter(m => !targets.has(m.sender.toLowerCase()));
    const removed = history.length - remaining.length;
    this.cache = remaining;
    await this.storage.put(STAGE_CHATTER_STORAGE_KEY, remaining);
    return { removed, remaining };
  }

  /** Read-only count for admin inspection — does not mutate storage. */
  async countBySenders(senders: string[]): Promise<{
    total: number;
    matching: number;
  }> {
    const targets = new Set(senders.map(s => s.trim().toLowerCase()).filter(Boolean));
    const history = await this.load();
    const matching = history.filter(m => targets.has(m.sender.toLowerCase())).length;
    return { total: history.length, matching };
  }

  /** Aggregate player senders for admin moderation. */
  async listUserSenders(): Promise<Array<{
    sender: string;
    user_id: string | null;
    count: number;
    last_ts: number;
  }>> {
    const history = await this.load();
    const byKey = new Map<string, {
      sender: string;
      user_id: string | null;
      count: number;
      last_ts: number;
    }>();
    for (const msg of history) {
      if (!msg.sender.startsWith('user:')) continue;
      const key = `${msg.userId ?? ''}\0${msg.sender.toLowerCase()}`;
      const hit = byKey.get(key);
      if (!hit) {
        byKey.set(key, {
          sender: msg.sender,
          user_id: msg.userId ?? null,
          count: 1,
          last_ts: msg.ts,
        });
      } else {
        hit.count += 1;
        hit.last_ts = Math.max(hit.last_ts, msg.ts);
        if (msg.userId && !hit.user_id) hit.user_id = msg.userId;
      }
    }
    return [...byKey.values()].sort((a, b) => b.last_ts - a.last_ts);
  }
}
