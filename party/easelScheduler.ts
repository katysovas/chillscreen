import type * as Party from 'partykit/server';
import { encode, type ServerMessage } from '../lib/multiplayer/protocol';
import { chatterAuthHeader } from '../lib/npcChatter/auth';
import { chatterApiBase } from '../lib/npcChatter/apiBase';
import { stageSlugForRoom } from '../lib/npcChatter/roomContext';
import { liveSegmentsDone } from '../lib/easel/segments';
import type { EaselSessionSync, EaselSlotSync } from '../lib/easel/types';

export type EaselSchedulerDeps = {
  room: Party.Room;
  broadcast: (msg: ServerMessage) => void;
  playerCount: () => number;
};

export class EaselScheduler {
  private sessionStart: number | null = null;
  private slots: EaselSlotSync[] = [];
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

  private async fetchEasels(): Promise<EaselSlotSync[]> {
    const res = await fetch(`${this.apiBase()}/api/easel?stage=${encodeURIComponent(this.stageSlug())}`);
    if (!res.ok) return [];
    const data = await res.json() as { slots: EaselSlotSync[] };
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
    }
  }

  async onFirstPlayer() {
    const rows = await this.fetchEasels();
    if (rows.length === 0) return;
    this.slots = rows;
    this.sessionStart = Date.now();
    this.broadcastSession();
    this.startCheckLoop();
  }

  async onLastPlayer() {
    this.stopCheckLoop();

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

  syncToClient(send: (msg: ServerMessage) => void) {
    if (this.sessionStart == null) return;
    send({
      t: 'easel-session',
      sessionStart: this.sessionStart,
      slots: this.slots,
    });
  }

  getStationedNpcIds(): Set<string> {
    return new Set(this.slots.filter(s => s.status === 'painting').map(s => s.npc));
  }

  getSession(): EaselSessionSync | null {
    if (this.sessionStart == null) return null;
    return { sessionStart: this.sessionStart, slots: this.slots };
  }
}
