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
  ): Promise<{ entry: StageChatterMessage; added: boolean }> {
    const cleaned = sender.startsWith('npc:') ? stripNpcChatterDots(text) : text;
    const entry: StageChatterMessage = { sender, text: cleaned, ts };
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
}
