import type * as Party from 'partykit/server';
import {
  decodeClient,
  encode,
  type PlayerState,
  type ServerMessage,
} from '../lib/multiplayer/protocol';

/**
 * Chillscreen presence room.
 *
 * Pure relay + ephemeral in-memory roster — no database, no accounts. Players
 * connect, announce a profile + spawn position, then stream movement and 1:1
 * chat. When a connection drops the player evaporates from the room.
 */
export default class ChillscreenServer implements Party.Server {
  /** connId → live player state (lives only in memory). */
  private players = new Map<string, PlayerState>();

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Hand the newcomer the current roster so it can render everyone already here.
    const welcome: ServerMessage = {
      t: 'welcome',
      selfId: conn.id,
      players: [...this.players.values()],
    };
    conn.send(encode(welcome));
  }

  onMessage(raw: string, sender: Party.Connection) {
    const msg = decodeClient(raw);
    if (!msg) return;

    switch (msg.t) {
      case 'join': {
        const player: PlayerState = {
          id: sender.id,
          name: msg.profile.name,
          balloonColor: msg.profile.balloonColor,
          worldX: msg.worldX,
          facing: msg.facing,
          walking: msg.walking,
        };
        this.players.set(sender.id, player);
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
        this.broadcastExcept(sender.id, {
          t: 'profile',
          id: sender.id,
          profile: msg.profile,
        });
        break;
      }

      case 'chat-open':
        this.sendTo(msg.to, { t: 'chat-open', from: sender.id });
        break;
      case 'chat-close':
        this.sendTo(msg.to, { t: 'chat-close', from: sender.id });
        break;
      case 'chat-typing':
        this.sendTo(msg.to, { t: 'chat-typing', from: sender.id, typing: msg.typing });
        break;
      case 'chat-msg':
        this.sendTo(msg.to, { t: 'chat-msg', from: sender.id, text: msg.text });
        break;
    }
  }

  onClose(conn: Party.Connection) {
    if (this.players.delete(conn.id)) {
      this.room.broadcast(encode({ t: 'left', id: conn.id }));
    }
  }

  onError(conn: Party.Connection) {
    this.onClose(conn);
  }

  private broadcastExcept(exceptId: string, msg: ServerMessage) {
    this.room.broadcast(encode(msg), [exceptId]);
  }

  private sendTo(connId: string, msg: ServerMessage) {
    this.room.getConnection(connId)?.send(encode(msg));
  }
}
