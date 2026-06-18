'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PartySocket from 'partysocket';
import type { FestiePublic } from '@/lib/festie/types';
import type { CreatorStageSyncPayload } from '@/lib/stages/stageSync';
import { mergeNpcSyncMap } from '@/lib/npcPositionSync';
import {
  chatPairKey,
  decodeServer,
  encode,
  type Facing,
  type PlayerLoadoutSync,
  type NpcConvoMeta,
  type PlayerProfile,
  type EaselSessionSync,
} from './protocol';
import { applyServerStageSync } from '@/lib/stageClock';
import { isChatterMuted } from '@/lib/chatterMuted';
import { getHumansOnlyStageChatter } from '@/lib/stageChatter/preferences';
import { isChatterDebugMode } from '@/lib/chatterDebug';
import { ilog, ierror, iwarn } from '@/lib/internalDebug';
import type { StageChatterMessage } from '@/lib/stageChatter/types';

/** What a remote avatar needs to render — kept in a ref, mutated without rerenders. */
export type RemotePlayerState = {
  name: string | null;
  balloonColor: string;
  loadout?: PlayerLoadoutSync;
  worldX: number;
  facing: Facing;
  walking: boolean;
};

/** Ephemeral public shout shown above a player. */
export type RemoteAmbientMessage = {
  text: string;
  until: number;
};

/** Player↔player chat visible to the whole room. */
export type RemoteChatPair = { a: string; b: string };

/** Player↔NPC chat replicated for the connect glow. */
export type RemoteNpcChat = { playerId: string; npcId: string };

/** NPC↔NPC server-driven conversation (connect glow on both). */
export type NpcConvoPair = { convoId: string; participants: [string, string] };

/** How long ambient shouts stay visible above a character. */
export const PLAYER_AMBIENT_VISIBLE_MS = 5_000;

type PeerEvents = {
  onPeerOpen?: (peerId: string) => void;
  onPeerClose?: (peerId: string) => void;
  onPeerTyping?: (peerId: string, typing: boolean) => void;
  onPeerMessage?: (peerId: string, text: string) => void;
  /** A peer dropped from the room entirely (disconnect / tab close). */
  onPeerLeft?: (peerId: string) => void;
  /** Public room line — sender is `user:{name}` or `npc:{id}`. */
  onRoomChat?: (sender: string, text: string, ts?: number) => void;
  /** Persisted stage chatter backlog (up to 2 days). */
  onStageChatterHistory?: (messages: StageChatterMessage[]) => void;
  /** Stage chatter typing signal — sender is `user:{name}` or `npc:{id}`. */
  onRoomTyping?: (sender: string, typing: boolean) => void;
  onNpcConvoStart?: (
    convoId: string,
    participants: [string, string],
    meta?: NpcConvoMeta,
  ) => void;
  onNpcLine?: (convoId: string, npc: string, text: string, ts?: number) => void;
  onNpcConvoEnd?: (convoId: string) => void;
};

type Options = PeerEvents & {
  /** Identity to announce on join. Read lazily so a late name still propagates. */
  profileRef: React.RefObject<PlayerProfile>;
  /** Signed-in user id — sent on join so offline festie hides while owner is online. */
  userIdRef?: React.RefObject<string | null>;
  /** Spawn position to announce on join (shared world coordinate). */
  spawnWorldOffRef: React.RefObject<number>;
  /** PartyKit room — one per city/stage for presence isolation. */
  roomId: string;
};

// Host of the deployed PartyKit room (whichstage.katysovas.partykit.dev).
// PartySocket wants bare host[:port] — no protocol.
//
// Localhost page:
//   • `?debug=true` on localhost → 127.0.0.1:1999 (local PartyKit + demo seed)
//   • `npm run dev:local` sets NEXT_PUBLIC_PARTYKIT_LOCAL=true → 127.0.0.1:1999
//   • plain `npm run dev` uses NEXT_PUBLIC_PARTYKIT_HOST (deployed PartyKit)
// Prod / deployed site:
//   • `?debug=true` keeps deployed PartyKit — extra logs + demo seed only
function partyKitHost(): string {
  const configured = (
    process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? '127.0.0.1:1999'
  )
    .trim()
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/\/+$/, '');

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    const isLocalPage = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalPage) {
      if (isChatterDebugMode()) {
        return '127.0.0.1:1999';
      }
      if (process.env.NEXT_PUBLIC_PARTYKIT_LOCAL === 'true') {
        return '127.0.0.1:1999';
      }
      if (process.env.NEXT_PUBLIC_PARTYKIT_HOST?.trim()) {
        return configured;
      }
      return '127.0.0.1:1999';
    }
  }
  return configured;
}

export type Multiplayer = {
  selfId: string | null;
  connected: boolean;
  /** Start the WebSocket handshake (idempotent). Deferred until gameplay begins. */
  requestConnect: () => void;
  /** Shared live roster (positions update here every tick). */
  remoteStateRef: React.RefObject<Map<string, RemotePlayerState>>;
  /** Live ambient shouts keyed by player id. */
  ambientRef: React.RefObject<Map<string, RemoteAmbientMessage>>;
  /** Re-renders only when players join/leave. */
  remoteIds: string[];
  /** Active player↔player conversations (for connect glow). */
  chatPairs: RemoteChatPair[];
  /** Active player↔NPC conversations (for connect glow). */
  remoteNpcChats: RemoteNpcChat[];
  /** Active NPC↔NPC conversations (for connect glow). */
  npcConvoPairs: NpcConvoPair[];
  /** Festies on this stage — includes online owners for live NPC chatter. */
  festies: FestiePublic[];
  /** Ambient NPC easel session — null until first watcher in room. */
  easelSession: EaselSessionSync | null;
  /** True when this client runs local NPC AI and relays positions. */
  isNpcLeader: boolean;
  /** Latest NPC world-x from the room leader (id → worldX). */
  /** Leader screen-% per NPC id — followers convert with local scroll + width. */
  npcSyncRef: React.RefObject<Map<string, number>>;
  sendMove: (worldX: number, facing: Facing, walking: boolean) => void;
  sendProfile: (profile: PlayerProfile) => void;
  openPeerChat: (to: string) => void;
  closePeerChat: (to: string) => void;
  sendPeerTyping: (to: string, typing: boolean) => void;
  sendPeerMessage: (to: string, text: string) => void;
  sendAmbientMessage: (text: string) => void;
  sendRoomChat: (text: string) => void;
  sendRoomTyping: (typing: boolean) => void;
  sendHumansOnlyChatter: (enabled: boolean) => void;
  sendNpcChat: (npcId: string, open: boolean) => void;
  sendNpcPositions: (positions: { id: string; worldX: number; pct: number }[], viewportWidth: number) => void;
  sendEaselPainterReady: (npcId: string) => void;
  sendCreatorStageSync: (stage: CreatorStageSyncPayload) => void;
  registerCreatorStageSyncHandler: (
    handler: ((stage: CreatorStageSyncPayload) => void) | null,
  ) => void;
  requestFestiesSync: () => void;
};

/**
 * Connects to the PartyKit presence room. Resilient by design: if the room is
 * unreachable the game keeps working single-player (no remote avatars). All
 * movement flows through a ref to avoid re-rendering the world on every packet.
 *
 * The socket is not opened on mount — call {@link requestConnect} (or send a
 * move) once the player is past first paint / welcome. Stage sync still works
 * via {@link bootstrapStageSyncFromApi} without PartyKit.
 */
export function useMultiplayer(opts: Options): Multiplayer {
  const socketRef = useRef<PartySocket | null>(null);
  const remoteStateRef = useRef<Map<string, RemotePlayerState>>(new Map());
  const ambientRef = useRef<Map<string, RemoteAmbientMessage>>(new Map());
  const npcSyncRef = useRef<Map<string, number>>(new Map());
  const lastMoveRef = useRef<{ worldX: number; facing: Facing; walking: boolean } | null>(null);
  /** Profile updates that arrive before the socket is open. */
  const pendingProfileRef = useRef<PlayerProfile | null>(null);
  /** Messages sent before the socket handshake completes. */
  const pendingSendRef = useRef<object[]>([]);
  const creatorStageSyncHandlerRef = useRef<((stage: CreatorStageSyncPayload) => void) | null>(null);

  const [selfId, setSelfId] = useState<string | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [shouldConnect, setShouldConnect] = useState(false);
  const [remoteIds, setRemoteIds] = useState<string[]>([]);
  const [chatPairs, setChatPairs] = useState<RemoteChatPair[]>([]);
  const [remoteNpcChats, setRemoteNpcChats] = useState<RemoteNpcChat[]>([]);
  const [npcConvoPairs, setNpcConvoPairs] = useState<NpcConvoPair[]>([]);
  const [festies, setFesties] = useState<FestiePublic[]>([]);
  const [easelSession, setEaselSession] = useState<EaselSessionSync | null>(null);
  const [isNpcLeader, setIsNpcLeader] = useState(false);

  const connectRequestedRef = useRef(false);

  const requestConnect = useCallback(() => {
    if (connectRequestedRef.current) return;
    connectRequestedRef.current = true;
    setShouldConnect(true);
  }, []);

  // Keep callbacks + lazily-read identity in refs so the socket effect can stay
  // mounted once and never goes stale.
  const eventsRef = useRef<PeerEvents>(opts);
  eventsRef.current = opts;
  const profileRef = opts.profileRef;
  const userIdRef = opts.userIdRef;
  const spawnRef = opts.spawnWorldOffRef;

  const sendNow = useCallback((data: object) => {
    const s = socketRef.current;
    if (s && s.readyState === WebSocket.OPEN) {
      s.send(encode(data as never));
      return;
    }
    pendingSendRef.current.push(data);
  }, []);

  const flushPending = useCallback(() => {
    const s = socketRef.current;
    if (!s || s.readyState !== WebSocket.OPEN) return;
    const batch = pendingSendRef.current;
    pendingSendRef.current = [];
    for (const data of batch) s.send(encode(data as never));
  }, []);

  useEffect(() => {
    if (!shouldConnect) return;

    const host = partyKitHost();
    const socket = new PartySocket({ host, room: opts.roomId });
    socketRef.current = socket;

    if (isChatterDebugMode()) {
      ilog('[partykit] debug mode — connecting to', host, 'room', opts.roomId);
    }

    const announceJoin = () => {
      const last = lastMoveRef.current;
      const profile = pendingProfileRef.current
        ?? profileRef.current
        ?? { name: null, balloonColor: '#ef4023' };
      const join: {
        t: 'join';
        profile: PlayerProfile;
        worldX: number;
        facing: Facing;
        walking: boolean;
        chatterMuted?: boolean;
        humansOnlyChatter?: boolean;
        chatterDebug?: boolean;
        userId?: string;
      } = {
        t: 'join',
        profile,
        worldX: last?.worldX ?? spawnRef.current ?? 0,
        facing: last?.facing ?? 'right',
        walking: last?.walking ?? false,
      };
      if (isChatterMuted()) join.chatterMuted = true;
      if (getHumansOnlyStageChatter()) join.humansOnlyChatter = true;
      if (isChatterDebugMode()) join.chatterDebug = true;
      const userId = userIdRef?.current?.trim();
      if (userId) join.userId = userId;
      sendNow(join);
    };

    const flushProfile = () => {
      const profile = pendingProfileRef.current ?? profileRef.current;
      if (profile) sendNow({ t: 'profile', profile });
    };

    const flushMove = () => {
      const last = lastMoveRef.current;
      if (last) sendNow({ t: 'move', ...last });
    };

    const onOpen = () => {
      setConnected(true);
      announceJoin();
      // Catch profile/loadout that landed while the handshake was in flight.
      flushProfile();
      flushPending();
    };

    const onClose = (e: CloseEvent) => {
      setConnected(false);
      if (e.code !== 1000 && e.code !== 1001) {
        iwarn('[partykit] disconnected', opts.roomId, { code: e.code, reason: e.reason || '(none)' });
      }
    };

    const onError = () => {
      ierror('[partykit] websocket error', opts.roomId, 'host', host);
      if (isChatterDebugMode() && typeof window !== 'undefined') {
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') {
          ierror('[partykit] debug on localhost needs local PartyKit — run: npm run party:dev');
        }
      }
    };

    const onMessage = (e: MessageEvent) => {
      const raw = typeof e.data === 'string' ? e.data : '';
      const msg = decodeServer(raw);
      if (!msg) {
        if (raw.length > 0) {
          iwarn('[partykit] unparseable message', opts.roomId, raw.slice(0, 120));
        }
        return;
      }
      const roster = remoteStateRef.current;
      const ev = eventsRef.current;

      switch (msg.t) {
        case 'welcome': {
          setSelfId(msg.selfId);
          selfIdRef.current = msg.selfId;
          if (msg.festies) setFesties(msg.festies);
          setIsNpcLeader(!msg.npcLeaderId || msg.npcLeaderId === msg.selfId);
          // Align our clock + adopt the pinned playlists so every venue plays
          // the same synchronized video for everyone in the room.
          if (msg.serverNow != null && msg.stage) {
            applyServerStageSync(msg.serverNow, msg.stage, 'partykit');
          }
          roster.clear();
          for (const p of msg.players) {
            roster.set(p.id, {
              name: p.name,
              balloonColor: p.balloonColor,
              loadout: p.loadout,
              worldX: p.worldX,
              facing: p.facing,
              walking: p.walking,
            });
          }
          setRemoteIds([...roster.keys()]);
          // Server ignores moves until join is processed — safe to flush now.
          flushMove();
          flushPending();
          break;
        }
        case 'joined': {
          const p = msg.player;
          roster.set(p.id, {
            name: p.name,
            balloonColor: p.balloonColor,
            loadout: p.loadout,
            worldX: p.worldX,
            facing: p.facing,
            walking: p.walking,
          });
          setRemoteIds([...roster.keys()]);
          break;
        }
        case 'left': {
          ambientRef.current.delete(msg.id);
          if (roster.delete(msg.id)) setRemoteIds([...roster.keys()]);
          setChatPairs(prev => prev.filter(p => p.a !== msg.id && p.b !== msg.id));
          setRemoteNpcChats(prev => prev.filter(c => c.playerId !== msg.id));
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
          if (p) {
            p.name = msg.profile.name;
            p.balloonColor = msg.profile.balloonColor;
            if (msg.profile.loadout !== undefined) {
              p.loadout = msg.profile.loadout;
            }
          }
          break;
        }
        case 'chat-open':   ev.onPeerOpen?.(msg.from); break;
        case 'chat-close':  ev.onPeerClose?.(msg.from); break;
        case 'chat-typing': ev.onPeerTyping?.(msg.from, msg.typing); break;
        case 'chat-msg':    ev.onPeerMessage?.(msg.from, msg.text); break;
        case 'chat-pair': {
          const key = chatPairKey(msg.a, msg.b);
          setChatPairs(prev => {
            if (msg.open) {
              if (prev.some(p => chatPairKey(p.a, p.b) === key)) return prev;
              return [...prev, { a: msg.a, b: msg.b }];
            }
            return prev.filter(p => chatPairKey(p.a, p.b) !== key);
          });
          break;
        }
        case 'npc-chat': {
          setRemoteNpcChats(prev => {
            if (msg.open) {
              const rest = prev.filter(c => c.playerId !== msg.from);
              return [...rest, { playerId: msg.from, npcId: msg.npcId }];
            }
            return prev.filter(c => c.playerId !== msg.from);
          });
          break;
        }
        case 'ambient':
          ambientRef.current.set(msg.from, {
            text: msg.text,
            until: Date.now() + PLAYER_AMBIENT_VISIBLE_MS,
          });
          break;
        case 'room-chat':
          ev.onRoomChat?.(msg.sender, msg.text, msg.ts);
          break;
        case 'room-typing':
          ev.onRoomTyping?.(msg.sender, msg.typing);
          break;
        case 'stage-chatter-history':
          ev.onStageChatterHistory?.(msg.messages);
          break;
        case 'npc-convo-start':
          setNpcConvoPairs(prev => {
            if (prev.some(p => p.convoId === msg.convoId)) return prev;
            return [...prev, { convoId: msg.convoId, participants: msg.participants }];
          });
          ev.onNpcConvoStart?.(msg.convoId, msg.participants, msg.meta);
          break;
        case 'npc-line':
          ev.onNpcLine?.(msg.convoId, msg.npc, msg.text, msg.ts);
          break;
        case 'npc-convo-end':
          setNpcConvoPairs(prev => prev.filter(p => p.convoId !== msg.convoId));
          ev.onNpcConvoEnd?.(msg.convoId);
          break;
        case 'festies-sync':
          setFesties(msg.festies);
          break;
        case 'easel-session':
        case 'easel-update':
          if (msg.slots?.length) {
            setEaselSession({ sessionStart: msg.sessionStart, slots: msg.slots });
          }
          break;
        case 'npc-positions-sync': {
          mergeNpcSyncMap(npcSyncRef.current, msg.positions);
          break;
        }
        case 'npc-leader':
          setIsNpcLeader(!msg.leaderId || msg.leaderId === selfIdRef.current);
          if (!msg.leaderId) npcSyncRef.current.clear();
          break;
        case 'creator-stage-sync':
          creatorStageSyncHandlerRef.current?.(msg.stage);
          break;
      }
    };

    socket.addEventListener('open', onOpen);
    socket.addEventListener('close', onClose);
    socket.addEventListener('error', onError);
    socket.addEventListener('message', onMessage);

    return () => {
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('close', onClose);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('message', onMessage);
      socket.close();
      socketRef.current = null;
      pendingSendRef.current = [];
    };
  // PARTYKIT_HOST is constant; refs are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldConnect, opts.roomId]);

  const sendMove = useCallback((worldX: number, facing: Facing, walking: boolean) => {
    requestConnect();
    lastMoveRef.current = { worldX, facing, walking };
    sendNow({ t: 'move', worldX, facing, walking });
  }, [requestConnect, sendNow]);

  const sendProfile = useCallback((profile: PlayerProfile) => {
    pendingProfileRef.current = profile;
    sendNow({ t: 'profile', profile });
  }, [sendNow]);

  const connectAndSend = useCallback((data: object) => {
    requestConnect();
    sendNow(data);
  }, [requestConnect, sendNow]);

  const openPeerChat   = useCallback((to: string) => connectAndSend({ t: 'chat-open', to }), [connectAndSend]);
  const closePeerChat  = useCallback((to: string) => connectAndSend({ t: 'chat-close', to }), [connectAndSend]);
  const sendPeerTyping = useCallback((to: string, typing: boolean) => connectAndSend({ t: 'chat-typing', to, typing }), [connectAndSend]);
  const sendPeerMessage = useCallback((to: string, text: string) => connectAndSend({ t: 'chat-msg', to, text }), [connectAndSend]);
  const sendAmbientMessage = useCallback((text: string) => connectAndSend({ t: 'ambient-msg', text }), [connectAndSend]);
  const sendRoomChat = useCallback((text: string) => connectAndSend({ t: 'room-chat', text }), [connectAndSend]);
  const sendRoomTyping = useCallback((typing: boolean) => connectAndSend({ t: 'room-typing', typing }), [connectAndSend]);
  const sendHumansOnlyChatter = useCallback(
    (enabled: boolean) => connectAndSend({ t: 'humans-only-chatter', enabled }),
    [connectAndSend],
  );
  const sendNpcChat = useCallback(
    (npcId: string, open: boolean) => connectAndSend({ t: 'npc-chat', npcId, open }),
    [connectAndSend],
  );
  const sendNpcPositions = useCallback(
    (positions: { id: string; worldX: number; pct: number }[], viewportWidth: number) =>
      connectAndSend({ t: 'npc-positions', positions, viewportWidth }),
    [connectAndSend],
  );
  const sendEaselPainterReady = useCallback(
    (npcId: string) => connectAndSend({ t: 'easel-painter-ready', npcId }),
    [connectAndSend],
  );
  const sendCreatorStageSync = useCallback(
    (stage: CreatorStageSyncPayload) => connectAndSend({ t: 'creator-stage-sync', stage }),
    [connectAndSend],
  );
  const requestFestiesSync = useCallback(
    () => connectAndSend({ t: 'festie-refresh' }),
    [connectAndSend],
  );
  const registerCreatorStageSyncHandler = useCallback(
    (handler: ((stage: CreatorStageSyncPayload) => void) | null) => {
      creatorStageSyncHandlerRef.current = handler;
    },
    [],
  );
  return {
    selfId, connected, requestConnect, remoteStateRef, ambientRef, remoteIds,
    chatPairs, remoteNpcChats, npcConvoPairs, festies, easelSession,
    isNpcLeader, npcSyncRef,
    sendMove, sendProfile, openPeerChat, closePeerChat, sendPeerTyping, sendPeerMessage,
    sendAmbientMessage, sendRoomChat, sendRoomTyping, sendHumansOnlyChatter, sendNpcChat, sendNpcPositions, sendEaselPainterReady,
    sendCreatorStageSync, registerCreatorStageSyncHandler, requestFestiesSync,
  };
}
