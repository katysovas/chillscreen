import type * as Party from 'partykit/server';
import {
  chatPairKey,
  decodeClient,
  encode,
  type PlayerState,
  type ServerMessage,
} from '../lib/multiplayer/protocol';
import { resolveStagePlaylists } from '../lib/resolveStagePlaylists';
import { filterChatMessage } from '../lib/messageFilter';
import { DEFAULT_DURATION_MS, STAGE_EPOCH, type StageSync } from '../lib/stageVideos';
import type { PlayerViewSnapshot } from '../lib/npcProximity';
import { NpcChatterScheduler } from './npcChatterScheduler';

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
  private stageSync: StageSync | null = null;
  private chatter: NpcChatterScheduler;

  constructor(readonly room: Party.Room) {
    this.chatter = new NpcChatterScheduler({
      room: this.room,
      broadcast: msg => this.room.broadcast(encode(msg)),
      playerCount: () => this.players.size,
      getActivePlayerViews: () => this.activePlayerViews(),
      getStageSync: () => this.stageSync,
    });
  }

  private activePlayerViews(): PlayerViewSnapshot[] {
    return [...this.players.values()].map(player => ({
      worldOff: player.worldX,
      viewportWidth:
        this.chatter.getPlayerViewportWidth(player.id) ?? this.chatter.getViewportWidth(),
    }));
  }

  async onConnect(conn: Party.Connection) {
    const playlists = await resolveStagePlaylists(this.room.env.YOUTUBE_API_KEY as string | undefined);
    this.stageSync = { epoch: STAGE_EPOCH, defaultDurationMs: DEFAULT_DURATION_MS, playlists };
    const welcome: ServerMessage = {
      t: 'welcome',
      selfId: conn.id,
      players: [...this.players.values()],
      serverNow: Date.now(),
      stage: this.stageSync,
    };
    conn.send(encode(welcome));
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
        if (wasEmpty) this.chatter.onFirstPlayer();
        this.broadcastExcept(sender.id, { t: 'joined', player });
        break;
      }

      case 'move': {
        const player = this.players.get(sender.id);
        if (!player) return;
        player.worldX = msg.worldX;
        player.facing = msg.facing;
        player.walking = msg.walking;
        this.broadcastExcept(sender.id, {
          t: 'moved',
          id: sender.id,
          worldX: msg.worldX,
          facing: msg.facing,
          walking: msg.walking,
        });
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
      case 'npc-positions':
        this.chatter.updateNpcPositions(msg.positions, msg.viewportWidth, sender.id);
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
    if (this.players.delete(conn.id)) {
      this.chatter.clearPlayerViewport(conn.id);
      this.room.broadcast(encode({ t: 'left', id: conn.id }));
    }
    if (this.players.size === 0) {
      this.chatter.onLastPlayer();
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

  private sendTo(connId: string, msg: ServerMessage) {
    this.room.getConnection(connId)?.send(encode(msg));
  }
}
