import type * as Party from 'partykit/server';
import { encode, type ServerMessage } from '../lib/multiplayer/protocol';
import { chatterAuthHeader } from '../lib/npcChatter/auth';
import { chatterApiBase } from '../lib/npcChatter/apiBase';
import { stageSlugForRoom } from '../lib/npcChatter/roomContext';
import { easelHoldExpired } from '../lib/easel/lifecycle';
import { liveSegmentsDone } from '../lib/easel/segments';
import type { EaselSessionSync, EaselSlotSync } from '../lib/easel/types';
import { EASEL_HOLD_MS } from '../lib/easel/types';

export type EaselSchedulerDeps = {
  room: Party.Room;
  broadcast: (msg: ServerMessage) => void;
  playerCount: () => number;
};

type SlotApiPayload = EaselSlotSync & { ok?: boolean; waiting?: boolean };

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

  private authHeaders(): Record<string, string> {
    const secret = this.env.NPC_CHATTER_SECRET?.trim();
    return chatterAuthHeader(secret);
  }

  private async fetchEasels(): Promise<EaselSlotSync[]> {
    const stage = this.stageSlug();
    const res = await fetch(
      `${this.apiBase()}/api/easel?stage=${encodeURIComponent(stage)}&sync=1`,
    );
    if (!res.ok) return [];
    const data = await res.json() as { slots: EaselSlotSync[] };
    return data.slots ?? [];
  }

  private async postEasel(body: Record<string, unknown>): Promise<SlotApiPayload | null> {
    const res = await fetch(`${this.apiBase()}/api/easel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json() as Promise<SlotApiPayload>;
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
    this.checkTimer = setInterval(() => void this.checkSession(), 1000);
  }

  private stopCheckLoop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  private applySlotFromApi(slot: number, payload: SlotApiPayload | null) {
    if (!payload || payload.ok === false) return false;
    const idx = this.slots.findIndex(s => s.slot === slot);
    const next: EaselSlotSync = {
      slot: payload.slot ?? slot,
      npc: payload.npc,
      drawing_id: payload.drawing_id,
      total_segments: payload.total_segments,
      segments_done: payload.segments_done,
      rate: payload.rate,
      status: payload.status,
      started_at: payload.started_at,
      topic: payload.topic,
      program: payload.program,
      completed_at: payload.completed_at,
    };
    if (idx >= 0) this.slots[idx] = next;
    else this.slots.push(next);
    return true;
  }

  private async checkSession() {
    if (this.sessionStart == null || this.deps.playerCount() === 0) return;
    const now = Date.now();
    const stage = this.stageSlug();
    let changed = false;

    for (const slot of [...this.slots]) {
      if (slot.status === 'painting') {
        const live = liveSegmentsDone(slot.segments_done, slot.rate, this.sessionStart, now);
        if (live < slot.total_segments) continue;

        const result = await this.postEasel({
          action: 'complete',
          stage,
          slot: slot.slot,
        });
        if (this.applySlotFromApi(slot.slot, result)) {
          console.log(
            `[easel:party] completed slot ${slot.slot} — hold ${EASEL_HOLD_MS / 1000}s before next painter`,
          );
          changed = true;
        }
        continue;
      }

      if (slot.status === 'done' && easelHoldExpired(slot.completed_at, now)) {
        const result = await this.postEasel({
          action: 'advanceIfReady',
          stage,
          slot: slot.slot,
        });
        if (result?.waiting) continue;

        if (result && result.status === 'painting') {
          this.slots = [result];
          this.sessionStart = Date.now();
          console.log(`[easel:party] next painter ${result.npc} @ slot ${slot.slot}`);
          changed = true;
          continue;
        }

        const refreshed = await this.fetchEasels();
        if (refreshed.length === 0) {
          this.slots = [];
          changed = true;
        } else {
          this.slots = refreshed;
          this.sessionStart = Date.now();
          changed = true;
        }
      }
    }

    if (changed) this.broadcastSession();
  }

  async onFirstPlayer() {
    const stage = this.stageSlug();
    await this.postEasel({ action: 'ensureSession', stage });
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
