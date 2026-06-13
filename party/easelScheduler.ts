import type * as Party from 'partykit/server';
import { encode, type ServerMessage } from '../lib/multiplayer/protocol';
import { chatterAuthHeader } from '../lib/npcChatter/auth';
import { chatterApiBase } from '../lib/npcChatter/apiBase';
import { stageSlugForRoom } from '../lib/npcChatter/roomContext';
import { liveSegmentsDone } from '../lib/easel/segments';
import type { EaselRow, EaselSessionSync, EaselSlotSync } from '../lib/easel/types';
import { EASEL_HOLD_MS } from '../lib/easel/types';

type EaselApiSlot = EaselRow;

export type EaselSchedulerDeps = {
  room: Party.Room;
  broadcast: (msg: ServerMessage) => void;
  playerCount: () => number;
};

export class EaselScheduler {
  private sessionStart: number | null = null;
  private slots: EaselSlotSync[] = [];
  private holdTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private readonly roomId: string;
  private readonly env: Record<string, string | undefined>;

  constructor(private deps: EaselSchedulerDeps) {
    this.roomId = deps.room.id;
    this.env = deps.room.env as Record<string, string | undefined>;
  }

  private apiBase(): string {
    return chatterApiBase(this.env);
  }

  private stageSlug(): string {
    return stageSlugForRoom(this.roomId);
  }

  private async fetchEasels(): Promise<EaselApiSlot[]> {
    const res = await fetch(`${this.apiBase()}/api/easel?stage=${encodeURIComponent(this.stageSlug())}`);
    if (!res.ok) return [];
    const data = await res.json() as { slots: EaselApiSlot[] };
    return data.slots ?? [];
  }

  private async postEasel(body: Record<string, unknown>): Promise<void> {
    const secret = this.env.NPC_CHATTER_SECRET?.trim();
    await fetch(`${this.apiBase()}/api/easel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...chatterAuthHeader(secret) },
      body: JSON.stringify(body),
    });
  }

  private toSync(rows: EaselApiSlot[]): EaselSlotSync[] {
    return rows.map(r => ({
      slot: r.slot,
      npc: r.npc,
      drawing_id: r.drawing_id,
      total_segments: r.total_segments,
      segments_done: r.segments_done,
      rate: r.rate,
      status: r.status,
      started_at: r.started_at,
    }));
  }

  private broadcastSession() {
    if (this.sessionStart == null) return;
    const msg: ServerMessage = {
      t: 'easel-session',
      sessionStart: this.sessionStart,
      slots: this.slots,
    };
    this.deps.broadcast(msg);
  }

  private startCheckLoop() {
    this.stopCheckLoop();
    this.checkTimer = setInterval(() => void this.checkCompletions(), 1000);
  }

  private stopCheckLoop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  private async checkCompletions() {
    if (this.sessionStart == null || this.deps.playerCount() === 0) return;
    const now = Date.now();

    for (const slot of this.slots) {
      if (slot.status !== 'painting') continue;
      const live = liveSegmentsDone(slot.segments_done, slot.rate, this.sessionStart, now);
      if (live < slot.total_segments) continue;

      await this.postEasel({
        action: 'complete',
        stage: this.stageSlug(),
        slot: slot.slot,
      });
      slot.status = 'done';
      slot.segments_done = slot.total_segments;
      this.broadcastSession();

      if (this.holdTimers.has(slot.slot)) clearTimeout(this.holdTimers.get(slot.slot)!);
      this.holdTimers.set(
        slot.slot,
        setTimeout(() => void this.rolloverSlot(slot.slot), EASEL_HOLD_MS),
      );
    }
  }

  private async rolloverSlot(slotIndex: number) {
    this.holdTimers.delete(slotIndex);
    if (this.deps.playerCount() === 0) return;

    const slot = this.slots.find(s => s.slot === slotIndex);
    if (!slot) return;

    await this.postEasel({
      action: 'rollover',
      stage: this.stageSlug(),
      slot: slotIndex,
      npc: slot.npc,
    });

    const rows = await this.fetchEasels();
    const updated = rows.find(r => r.slot === slotIndex);
    if (!updated) return;

    const idx = this.slots.findIndex(s => s.slot === slotIndex);
    if (idx >= 0) this.slots[idx] = this.toSync([updated])[0]!;

    this.sessionStart = Date.now();
    this.broadcastSession();
  }

  async onFirstPlayer() {
    const rows = await this.fetchEasels();
    if (rows.length === 0) return;
    this.slots = this.toSync(rows);
    this.sessionStart = Date.now();
    this.broadcastSession();
    this.startCheckLoop();
  }

  async onLastPlayer() {
    this.stopCheckLoop();
    for (const t of this.holdTimers.values()) clearTimeout(t);
    this.holdTimers.clear();

    if (this.sessionStart == null) return;
    const now = Date.now();
    const stage = this.stageSlug();

    for (const slot of this.slots) {
      if (slot.status !== 'painting') continue;
      const live = liveSegmentsDone(slot.segments_done, slot.rate, this.sessionStart, now);
      await this.postEasel({
        action: 'checkpoint',
        stage,
        slot: slot.slot,
        segments_done: Math.min(live, slot.total_segments),
      });
    }

    this.sessionStart = null;
  }

  /** Send current session to a joining client. */
  syncToClient(send: (msg: ServerMessage) => void) {
    if (this.sessionStart == null) return;
    send({
      t: 'easel-session',
      sessionStart: this.sessionStart,
      slots: this.slots,
    });
  }

  getStationedNpcIds(): Set<string> {
    return new Set(this.slots.map(s => s.npc));
  }

  getSession(): EaselSessionSync | null {
    if (this.sessionStart == null) return null;
    return { sessionStart: this.sessionStart, slots: this.slots };
  }
}
