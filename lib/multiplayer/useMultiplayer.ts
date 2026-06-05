'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PartySocket from 'partysocket';
import {
  ROOM_ID,
  decodeServer,
  encode,
  type Facing,
  type PlayerProfile,
} from './protocol';
import { applyServerStageSync } from '@/lib/stageClock';

/** What a remote avatar needs to render — kept in a ref, mutated without rerenders. */
export type RemotePlayerState = {
  name: string | null;
  balloonColor: string;
  worldX: number;
  facing: Facing;
  walking: boolean;
};

type PeerEvents = {
  onPeerOpen?: (peerId: string) => void;
  onPeerClose?: (peerId: string) => void;
  onPeerTyping?: (peerId: string, typing: boolean) => void;
  onPeerMessage?: (peerId: string, text: string) => void;
  /** A peer dropped from the room entirely (disconnect / tab close). */
  onPeerLeft?: (peerId: string) => void;
};

type Options = PeerEvents & {
  /** Identity to announce on join. Read lazily so a late name still propagates. */
  profileRef: React.RefObject<PlayerProfile>;
  /** Spawn position to announce on join (shared world coordinate). */
  spawnWorldOffRef: React.RefObject<number>;
};

// Host of the deployed PartyKit room (e.g. "chillscreen.<user>.partykit.dev").
// On localhost we always use the local `partykit dev` server so `.env.local`
// can keep the production host for deploys. Accepts a bare host or a full URL —
// PartySocket only wants the host[:port], and auto-selects ws/wss.
function partyKitHost(): string {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '127.0.0.1:1999';
    }
  }
  return (
    process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? '127.0.0.1:1999'
  )
    .trim()
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/\/+$/, '');
}

export type Multiplayer = {
  selfId: string | null;
  connected: boolean;
  /** Stable ref to the live roster (positions update here every tick). */
  remoteStateRef: React.RefObject<Map<string, RemotePlayerState>>;
  /** Re-renders only when players join/leave. */
  remoteIds: string[];
  sendMove: (worldX: number, facing: Facing, walking: boolean) => void;
  sendProfile: (profile: PlayerProfile) => void;
  openPeerChat: (to: string) => void;
  closePeerChat: (to: string) => void;
  sendPeerTyping: (to: string, typing: boolean) => void;
  sendPeerMessage: (to: string, text: string) => void;
};

/**
 * Connects to the PartyKit presence room. Resilient by design: if the room is
 * unreachable the game keeps working single-player (no remote avatars). All
 * movement flows through a ref to avoid re-rendering the world on every packet.
 */
export function useMultiplayer(opts: Options): Multiplayer {
  const socketRef = useRef<PartySocket | null>(null);
  const remoteStateRef = useRef<Map<string, RemotePlayerState>>(new Map());

  const [selfId, setSelfId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [remoteIds, setRemoteIds] = useState<string[]>([]);

  // Keep callbacks + lazily-read identity in refs so the socket effect can stay
  // mounted once and never goes stale.
  const eventsRef = useRef<PeerEvents>(opts);
  eventsRef.current = opts;
  const profileRef = opts.profileRef;
  const spawnRef = opts.spawnWorldOffRef;

  const send = useCallback((data: object) => {
    const s = socketRef.current;
    if (s && s.readyState === WebSocket.OPEN) s.send(encode(data as never));
  }, []);

  useEffect(() => {
    const socket = new PartySocket({ host: partyKitHost(), room: ROOM_ID });
    socketRef.current = socket;

    const announceJoin = () => {
      send({
        t: 'join',
        profile: profileRef.current ?? { name: null, balloonColor: '#ef4023' },
        worldX: spawnRef.current ?? 0,
        facing: 'right',
        walking: false,
      });
    };

    const onOpen = () => {
      setConnected(true);
      announceJoin();
    };
    const onClose = () => setConnected(false);

    const onMessage = (e: MessageEvent) => {
      const msg = decodeServer(typeof e.data === 'string' ? e.data : '');
      if (!msg) return;
      const roster = remoteStateRef.current;
      const ev = eventsRef.current;

      switch (msg.t) {
        case 'welcome': {
          setSelfId(msg.selfId);
          // Align our clock + adopt the pinned playlists so every venue plays
          // the same synchronized video for everyone in the room.
          if (msg.serverNow != null && msg.stage) {
            applyServerStageSync(msg.serverNow, msg.stage);
          }
          roster.clear();
          for (const p of msg.players) {
            roster.set(p.id, {
              name: p.name, balloonColor: p.balloonColor,
              worldX: p.worldX, facing: p.facing, walking: p.walking,
            });
          }
          setRemoteIds([...roster.keys()]);
          break;
        }
        case 'joined': {
          const p = msg.player;
          roster.set(p.id, {
            name: p.name, balloonColor: p.balloonColor,
            worldX: p.worldX, facing: p.facing, walking: p.walking,
          });
          setRemoteIds([...roster.keys()]);
          break;
        }
        case 'left': {
          if (roster.delete(msg.id)) setRemoteIds([...roster.keys()]);
          ev.onPeerLeft?.(msg.id);
          break;
        }
        case 'moved': {
          const p = roster.get(msg.id);
          if (p) { p.worldX = msg.worldX; p.facing = msg.facing; p.walking = msg.walking; }
          break;
        }
        case 'profile': {
          const p = roster.get(msg.id);
          if (p) { p.name = msg.profile.name; p.balloonColor = msg.profile.balloonColor; }
          break;
        }
        case 'chat-open':   ev.onPeerOpen?.(msg.from); break;
        case 'chat-close':  ev.onPeerClose?.(msg.from); break;
        case 'chat-typing': ev.onPeerTyping?.(msg.from, msg.typing); break;
        case 'chat-msg':    ev.onPeerMessage?.(msg.from, msg.text); break;
      }
    };

    socket.addEventListener('open', onOpen);
    socket.addEventListener('close', onClose);
    socket.addEventListener('message', onMessage);

    return () => {
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('close', onClose);
      socket.removeEventListener('message', onMessage);
      socket.close();
      socketRef.current = null;
    };
  // PARTYKIT_HOST is constant; refs are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMove = useCallback((worldX: number, facing: Facing, walking: boolean) => {
    send({ t: 'move', worldX, facing, walking });
  }, [send]);

  const sendProfile = useCallback((profile: PlayerProfile) => {
    send({ t: 'profile', profile });
  }, [send]);

  const openPeerChat   = useCallback((to: string) => send({ t: 'chat-open', to }), [send]);
  const closePeerChat  = useCallback((to: string) => send({ t: 'chat-close', to }), [send]);
  const sendPeerTyping = useCallback((to: string, typing: boolean) => send({ t: 'chat-typing', to, typing }), [send]);
  const sendPeerMessage = useCallback((to: string, text: string) => send({ t: 'chat-msg', to, text }), [send]);

  return {
    selfId, connected, remoteStateRef, remoteIds,
    sendMove, sendProfile, openPeerChat, closePeerChat, sendPeerTyping, sendPeerMessage,
  };
}
