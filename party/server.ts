import type * as Party from 'partykit/server';
import { FESTIE_CONFIG } from '../lib/festie/config';
import type { FestiePublic } from '../lib/festie/types';
import { setFestieChatterRoster } from '../lib/npcRoster.server';
import type { Facing } from '../lib/multiplayer/protocol';
import {
  chatPairKey,
  decodeClient,
  encode,
  type PlayerMoveSync,
  type PlayerState,
  type ServerMessage,
} from '../lib/multiplayer/protocol';
import { diffNpcPositions, type NpcPositionSync } from '../lib/npcPositionSync';
import {
  normalizeNpcLeaderCapability,
  pickNpcLeaderId,
  type NpcLeaderCapability,
} from '../lib/npcLeaderCapability';
import { chatterApiBase } from '../lib/npcChatter/apiBase';
import { chatterAuthHeader } from '../lib/npcChatter/auth';
import { venueSlugFromRoomId } from '../lib/npcChatter/roomContext';
import { resolveStagePlaylists } from '../lib/resolveStagePlaylists';
import { filterChatMessage } from '../lib/messageFilter';
import { DEFAULT_DURATION_MS, STAGE_EPOCH, type StageSync } from '../lib/stageVideos';
import type { PlayerViewSnapshot } from '../lib/npcProximity';
import { NpcChatterScheduler } from './npcChatterScheduler';
import { EaselScheduler } from './easelScheduler';

/**
 * WhichStage presence room.
 *
 * Pure relay + ephemeral in-memory roster — no database, no accounts. Players
 * connect, announce a profile + spawn position, then stream movement and public
 * room chat. When a connection drops the player evaporates from the room.
 */
export default class WhichStageServer implements Party.Server {
  /** connId → live player state (lives only in memory). */
  private players = new Map<string, PlayerState>();
  /** Active player↔player chat pairs — keyed for dedup. */
  private chatPairs = new Map<string, { a: string; b: string }>();
  /** Player id → NPC id while in a local NPC conversation. */
  private npcChats = new Map<string, string>();
  /** Players who joined with `?mute=true` — disables room NPC chatter while any remain. */
  private chatterMutedPlayers = new Set<string>();
  /** Players who enabled humans-only stage chat — disables room NPC chatter while any remain. */
  private humansOnlyPlayers = new Set<string>();
  /** Players who joined with `?debug=true` — demo seed only while any remain. */
  private chatterDebugPlayers = new Set<string>();
  /** connId → signed-in user id (for festie presence / seen debounce). */
  private connUserIds = new Map<string, string>();
  /** Debounced last_seen_at when owner disconnects (userId → timer). */
  private festieSeenTimers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Coalesce festie roster refresh after rapid leave events. */
  private festiesSyncTimer: ReturnType<typeof setTimeout> | null = null;
  /** Connection id whose local NPC sim is authoritative for the room. */
  private npcLeaderId: string | null = null;
  /** Join-reported device scores — used to elect the NPC sim leader. */
  private playerCapabilities = new Map<string, NpcLeaderCapability>();
  /** Latest leader snapshot — replayed to late joiners. */
  private lastNpcPositionsSync: Extract<ServerMessage, { t: 'npc-positions-sync' }> | null = null;
  /** Moves to include in the next batched tick (~10 Hz room-wide fan-out). */
  private moveBatchPending = new Map<string, { worldX: number; facing: Facing; walking: boolean }>();
  private moveRelayLastSent = new Map<string, { worldX: number; facing: Facing; walking: boolean }>();
  private moveTickTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly MOVE_TICK_MS = 100;
  private stageSync: StageSync | null = null;
  private chatter: NpcChatterScheduler;
  private easels: EaselScheduler;

  constructor(readonly room: Party.Room) {
    this.chatter = new NpcChatterScheduler({
      room: this.room,
      broadcast: msg => this.room.broadcast(encode(msg)),
      playerCount: () => this.players.size,
      getActivePlayerViews: () => this.activePlayerViews(),
      getStageSync: () => this.stageSync,
      internalDebug: () => this.chatterMutedPlayers.size > 0 || this.chatterDebugPlayers.size > 0,
      chatterDebug: () => this.chatterDebugPlayers.size > 0,
    });
    this.easels = new EaselScheduler({
      room: this.room,
      broadcast: msg => this.room.broadcast(encode(msg)),
      playerCount: () => this.players.size,
      internalDebug: () => this.chatterMutedPlayers.size > 0 || this.chatterDebugPlayers.size > 0,
    });
  }

  private activePlayerViews(): PlayerViewSnapshot[] {
    return [...this.players.values()].map(player => ({
      worldOff: player.worldX,
      viewportWidth:
        this.chatter.getPlayerViewportWidth(player.id) ?? this.chatter.getViewportWidth(),
    }));
  }

  private shouldSuppressNpcChatter(): boolean {
    return this.chatterMutedPlayers.size > 0 || this.humansOnlyPlayers.size > 0;
  }

  private syncChatterDisabled(): void {
    this.chatter.setChatterDisabled(this.shouldSuppressNpcChatter());
  }

  async onConnect(conn: Party.Connection) {
    const playlists = await resolveStagePlaylists(this.room.env.YOUTUBE_API_KEY as string | undefined);
    this.stageSync = { epoch: STAGE_EPOCH, defaultDurationMs: DEFAULT_DURATION_MS, playlists };
    const festies = await this.fetchFesties();
    this.electNpcLeader();
    const welcome: ServerMessage = {
      t: 'welcome',
      selfId: conn.id,
      players: [...this.players.values()],
      serverNow: Date.now(),
      stage: this.stageSync,
      festies,
      npcLeaderId: this.npcLeaderId,
    };
    conn.send(encode(welcome));
    void this.chatter.getStageChatterHistory().then(messages => {
      if (messages.length === 0) return;
      conn.send(encode({ t: 'stage-chatter-history', messages }));
    });
    this.easels.syncToClient(msg => conn.send(encode(msg)));
  }

  onMessage(raw: string, sender: Party.Connection) {
    try {
      this.handleMessage(raw, sender);
    } catch (err) {
      console.error(
        `[whichstage] onMessage failed room=${this.room.id} conn=${sender.id}`,
        err,
      );
    }
  }

  private handleMessage(raw: string, sender: Party.Connection) {
    const msg = decodeClient(raw);
    if (!msg) return;

    switch (msg.t) {
      case 'join': {
        const wasEmpty = this.players.size === 0;
        const player: PlayerState = {
          id: sender.id,
          name: msg.profile.name,
          balloonColor: msg.profile.balloonColor,
          loadout: msg.profile.loadout,
          worldX: msg.worldX,
          facing: msg.facing,
          walking: msg.walking,
        };
        this.players.set(sender.id, player);
        if (msg.userId?.trim()) {
          const uid = msg.userId.trim();
          this.connUserIds.set(sender.id, uid);
          this.cancelFestieSeen(uid);
          void this.postFestiePresence(uid, true);
        }
        if (msg.chatterMuted) {
          this.chatterMutedPlayers.add(sender.id);
        }
        if (msg.humansOnlyChatter) {
          this.humansOnlyPlayers.add(sender.id);
        }
        if (wasEmpty) {
          if (!this.shouldSuppressNpcChatter()) {
            this.chatter.onFirstPlayer();
          } else {
            this.chatter.setChatterDisabled(true);
          }
          void this.easels.onFirstPlayer();
        } else {
          this.syncChatterDisabled();
        }
        if (msg.chatterDebug) {
          this.chatterDebugPlayers.add(sender.id);
        }
        this.playerCapabilities.set(
          sender.id,
          normalizeNpcLeaderCapability(msg.capability),
        );
        const leaderBefore = this.npcLeaderId;
        this.electNpcLeader();
        this.broadcastExcept(sender.id, { t: 'joined', player });
        if (this.npcLeaderId !== leaderBefore) {
          this.broadcastNpcLeader();
        } else {
          this.sendTo(sender.id, { t: 'npc-leader', leaderId: this.npcLeaderId });
        }
        if (this.lastNpcPositionsSync && sender.id !== this.npcLeaderId) {
          this.sendTo(sender.id, this.lastNpcPositionsSync);
        }
        void this.broadcastFestiesSync();
        break;
      }

      case 'move': {
        const player = this.players.get(sender.id);
        if (!player) return;
        player.worldX = msg.worldX;
        player.facing = msg.facing;
        player.walking = msg.walking;
        this.queueMoveRelay(sender.id, msg.worldX, msg.facing, msg.walking);
        break;
      }

      case 'profile': {
        const player = this.players.get(sender.id);
        if (!player) return;
        player.name = msg.profile.name;
        player.balloonColor = msg.profile.balloonColor;
        if (msg.profile.loadout !== undefined) {
          player.loadout = msg.profile.loadout;
        }
        this.broadcastExcept(sender.id, {
          t: 'profile',
          id: sender.id,
          profile: msg.profile,
        });
        break;
      }

      case 'chat-open': {
        this.sendTo(msg.to, { t: 'chat-open', from: sender.id });
        const pair = { a: sender.id, b: msg.to };
        this.chatPairs.set(chatPairKey(pair.a, pair.b), pair);
        this.room.broadcast(
          encode({ t: 'chat-pair', a: pair.a, b: pair.b, open: true }),
        );
        break;
      }
      case 'chat-close': {
        this.sendTo(msg.to, { t: 'chat-close', from: sender.id });
        const key = chatPairKey(sender.id, msg.to);
        if (this.chatPairs.delete(key)) {
          this.room.broadcast(
            encode({ t: 'chat-pair', a: sender.id, b: msg.to, open: false }),
          );
        }
        break;
      }
      case 'chat-typing':
        this.sendTo(msg.to, { t: 'chat-typing', from: sender.id, typing: msg.typing });
        break;
      case 'chat-msg': {
        const filtered = filterChatMessage(msg.text);
        if (!filtered.ok) return;
        const player = this.players.get(sender.id);
        const label = player?.name?.trim() || sender.id.slice(0, 8);
        this.chatter.handleRoomChat(`user:${label}`, filtered.text);
        // Mirror to partner for connected-chat overlay sync.
        this.sendTo(msg.to, { t: 'chat-msg', from: sender.id, text: filtered.text });
        break;
      }
      case 'room-chat': {
        const filtered = filterChatMessage(msg.text);
        if (!filtered.ok) return;
        const player = this.players.get(sender.id);
        const label = player?.name?.trim() || sender.id.slice(0, 8);
        this.chatter.handleRoomChat(`user:${label}`, filtered.text);
        break;
      }
      case 'room-typing': {
        const player = this.players.get(sender.id);
        const label = player?.name?.trim() || sender.id.slice(0, 8);
        this.room.broadcast(
          encode({ t: 'room-typing', sender: `user:${label}`, typing: msg.typing }),
          [sender.id],
        );
        break;
      }
      case 'humans-only-chatter': {
        if (msg.enabled) {
          this.humansOnlyPlayers.add(sender.id);
        } else {
          this.humansOnlyPlayers.delete(sender.id);
        }
        this.syncChatterDisabled();
        break;
      }
      case 'ambient-msg': {
        const filtered = filterChatMessage(msg.text);
        if (!filtered.ok) return;
        const player = this.players.get(sender.id);
        const label = player?.name?.trim() || sender.id.slice(0, 8);
        this.chatter.handleRoomChat(`user:${label}`, filtered.text);
        break;
      }
      case 'npc-chat': {
        if (msg.open) {
          this.npcChats.set(sender.id, msg.npcId);
        } else {
          this.npcChats.delete(sender.id);
        }
        this.room.broadcast(
          encode({ t: 'npc-chat', from: sender.id, npcId: msg.npcId, open: msg.open }),
        );
        break;
      }
      case 'npc-positions': {
        if (sender.id !== this.npcLeaderId) break;
        this.chatter.updateNpcPositions(msg.positions, msg.viewportWidth, sender.id);
        const delta = diffNpcPositions(
          msg.positions as NpcPositionSync[],
          this.lastNpcPositionsSync?.positions ?? [],
        );
        if (delta.length === 0) break;
        const merged = this.mergeNpcPositionSnapshot(
          this.lastNpcPositionsSync?.positions ?? [],
          delta,
        );
        const serverNow = Date.now();
        this.lastNpcPositionsSync = {
          t: 'npc-positions-sync',
          leaderId: sender.id,
          serverNow,
          positions: merged,
        };
        this.room.broadcast(
          encode({
            t: 'npc-positions-sync',
            leaderId: sender.id,
            serverNow,
            positions: delta,
          }),
          [sender.id],
        );
        break;
      }
      case 'easel-painter-ready':
        this.easels.onPainterReady(msg.npcId);
        break;
      case 'creator-stage-sync':
        this.room.broadcast(encode({ t: 'creator-stage-sync', stage: msg.stage }), [sender.id]);
        break;

      case 'festie-refresh':
        void this.broadcastFestiesSync();
        break;
    }
  }

  async onAlarm() {
    await this.chatter.onAlarm();
  }

  onClose(conn: Party.Connection) {
    for (const [key, pair] of this.chatPairs) {
      if (pair.a === conn.id || pair.b === conn.id) {
        this.chatPairs.delete(key);
        this.room.broadcast(
          encode({ t: 'chat-pair', a: pair.a, b: pair.b, open: false }),
        );
      }
    }
    const npcId = this.npcChats.get(conn.id);
    if (npcId) {
      this.npcChats.delete(conn.id);
      this.room.broadcast(
        encode({ t: 'npc-chat', from: conn.id, npcId, open: false }),
      );
    }
    const wasMuted = this.chatterMutedPlayers.delete(conn.id);
    const wasHumansOnly = this.humansOnlyPlayers.delete(conn.id);
    this.chatterDebugPlayers.delete(conn.id);
    const wasLeader = conn.id === this.npcLeaderId;
    const userId = this.connUserIds.get(conn.id);
    this.connUserIds.delete(conn.id);
    this.playerCapabilities.delete(conn.id);
    this.clearMoveRelay(conn.id);
    if (this.players.delete(conn.id)) {
      this.chatter.clearPlayerViewport(conn.id);
      this.room.broadcast(encode({ t: 'left', id: conn.id }));
    }
    if (userId) {
      this.scheduleFestieSeen(userId);
      this.scheduleFestiesSync();
    }
    if (wasMuted || wasHumansOnly) {
      this.syncChatterDisabled();
    }
    if (this.players.size === 0) {
      this.npcLeaderId = null;
      this.lastNpcPositionsSync = null;
      this.stopMoveTick();
      this.chatter.onLastPlayer();
      void this.easels.onLastPlayer();
    } else if (wasLeader) {
      this.electNpcLeader();
      this.broadcastNpcLeader();
    }
  }

  onError(conn: Party.Connection, err: Error) {
    console.error(
      `[whichstage] connection error room=${this.room.id} conn=${conn.id}`,
      err,
    );
    this.onClose(conn);
  }

  private broadcastExcept(exceptId: string, msg: ServerMessage) {
    this.room.broadcast(encode(msg), [exceptId]);
  }

  private queueMoveRelay(
    id: string,
    worldX: number,
    facing: Facing,
    walking: boolean,
  ) {
    if (this.players.size <= 1) return;
    this.moveBatchPending.set(id, { worldX, facing, walking });
    this.ensureMoveTick();
  }

  private ensureMoveTick() {
    if (this.moveTickTimer != null) return;
    this.moveTickTimer = setTimeout(() => {
      this.moveTickTimer = null;
      this.flushMoveBatch();
    }, WhichStageServer.MOVE_TICK_MS);
  }

  private flushMoveBatch() {
    if (this.moveBatchPending.size === 0 || this.players.size <= 1) {
      this.moveBatchPending.clear();
      return;
    }

    const pending = this.moveBatchPending;
    this.moveBatchPending = new Map();

    const moves: PlayerMoveSync[] = [];
    for (const [id, latest] of pending) {
      if (!this.players.has(id)) continue;
      const last = this.moveRelayLastSent.get(id);
      if (
        last
        && last.facing === latest.facing
        && last.walking === latest.walking
        && Math.abs(last.worldX - latest.worldX) < 0.5
      ) {
        continue;
      }
      this.moveRelayLastSent.set(id, { ...latest });
      moves.push({ id, ...latest });
    }

    if (moves.length > 0) {
      this.room.broadcast(encode({ t: 'moves-batch', moves }));
    }

    if (this.moveBatchPending.size > 0) this.ensureMoveTick();
  }

  private stopMoveTick() {
    if (this.moveTickTimer) {
      clearTimeout(this.moveTickTimer);
      this.moveTickTimer = null;
    }
    this.moveBatchPending.clear();
    this.moveRelayLastSent.clear();
  }

  private clearMoveRelay(id: string) {
    this.moveBatchPending.delete(id);
    this.moveRelayLastSent.delete(id);
  }

  /** Merge delta into the cached snapshot for late joiners. */
  private mergeNpcPositionSnapshot(
    previous: NpcPositionSync[],
    delta: NpcPositionSync[],
  ): NpcPositionSync[] {
    const map = new Map(previous.map(p => [p.id, p]));
    for (const p of delta) map.set(p.id, p);
    return [...map.values()];
  }

  private electNpcLeader(): void {
    const next = pickNpcLeaderId(
      [...this.players.keys()],
      this.playerCapabilities,
      this.npcLeaderId,
    );
    this.npcLeaderId = next;
  }

  private broadcastNpcLeader() {
    this.room.broadcast(encode({ t: 'npc-leader', leaderId: this.npcLeaderId }));
  }

  private sendTo(connId: string, msg: ServerMessage) {
    this.room.getConnection(connId)?.send(encode(msg));
  }

  private festiesApiBase(): string {
    return chatterApiBase(this.room.env as Record<string, string | undefined>);
  }

  private onlineUserIds(): string[] {
    return [...new Set(this.connUserIds.values())];
  }

  private async fetchFesties(): Promise<FestiePublic[]> {
    const stageSlug = venueSlugFromRoomId(this.room.id);
    if (!stageSlug) return [];

    const params = new URLSearchParams({ stage_slug: stageSlug });
    const online = this.onlineUserIds();
    if (online.length > 0) params.set('online', online.join(','));

    const env = this.room.env as Record<string, string | undefined>;
    try {
      const res = await fetch(`${this.festiesApiBase()}/api/festies/stage?${params}`, {
        headers: chatterAuthHeader(env.NPC_CHATTER_SECRET),
      });
      if (!res.ok) {
        console.error('[festies-sync] api', res.status, await res.text());
        return [];
      }
      const data = await res.json() as { festies?: FestiePublic[] };
      const festies = data.festies ?? [];
      setFestieChatterRoster(festies);
      return festies;
    } catch (err) {
      console.error('[festies-sync] fetch failed', err);
      return [];
    }
  }

  private async broadcastFestiesSync(): Promise<void> {
    const festies = await this.fetchFesties();
    this.room.broadcast(encode({ t: 'festies-sync', festies }));
  }

  /** Debounce leave churn — join still refreshes immediately. */
  private scheduleFestiesSync(): void {
    if (this.festiesSyncTimer) clearTimeout(this.festiesSyncTimer);
    this.festiesSyncTimer = setTimeout(() => {
      this.festiesSyncTimer = null;
      void this.broadcastFestiesSync();
    }, 3000);
  }

  private cancelFestieSeen(userId: string) {
    const timer = this.festieSeenTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.festieSeenTimers.delete(userId);
    }
  }

  private scheduleFestieSeen(userId: string) {
    this.cancelFestieSeen(userId);
    const timer = setTimeout(() => {
      this.festieSeenTimers.delete(userId);
      void this.postFestieSeen(userId);
    }, FESTIE_CONFIG.DISCONNECT_DEBOUNCE_MS);
    this.festieSeenTimers.set(userId, timer);
  }

  private async postFestieSeen(userId: string): Promise<void> {
    const env = this.room.env as Record<string, string | undefined>;
    try {
      const res = await fetch(`${this.festiesApiBase()}/api/festie/seen`, {
        method: 'POST',
        headers: {
          ...chatterAuthHeader(env.NPC_CHATTER_SECRET),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        console.error('[festie-seen] api', res.status, await res.text());
      }
    } catch (err) {
      console.error('[festie-seen] fetch failed', err);
    }
  }

  private async postFestiePresence(userId: string, online: boolean): Promise<void> {
    const env = this.room.env as Record<string, string | undefined>;
    try {
      const res = await fetch(`${this.festiesApiBase()}/api/festie/presence`, {
        method: 'POST',
        headers: {
          ...chatterAuthHeader(env.NPC_CHATTER_SECRET),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, online }),
      });
      if (!res.ok) {
        console.error('[festie-presence] api', res.status, await res.text());
      }
    } catch (err) {
      console.error('[festie-presence] fetch failed', err);
    }
  }

  /** HTTP stats for stage picker festie counts (GET /parties/whichstage/:room). */
  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }
    return Response.json({ players: this.players.size });
  }
}
