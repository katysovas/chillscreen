'use client';

import { useCallback, useRef, useState } from 'react';
import { stripNpcChatterDots } from '@/lib/messageFilter';
import { clearNpcConvoAnchor } from '@/lib/npcConvoAnchor';
import { appendChatLine, createChatLine, type ChatLine, type KeyedChatLine } from '@/lib/chatLines';
import { AMBIENT_VISIBLE_MS, AMBIENT_VISIBLE_JITTER_MS } from '@/lib/npcAmbientChat';
import { PLAYER_AMBIENT_VISIBLE_MS } from '@/lib/multiplayer/useMultiplayer';

/** Keep pair-chat bubbles on screen after the server ends the convo. */
export const NPC_PAIR_CHAT_LINGER_MS = 12_000;

export type NpcConvoState = {
  convoId: string;
  participants: [string, string];
  lines: KeyedChatLine[];
};

export type RoomChatterState = {
  /** NPC id → solo public lines (mentions, not in a pair convo). */
  npcMessages: Map<string, ChatLine[]>;
  /** Player conn id → public bubble lines. */
  playerMessages: Map<string, ChatLine[]>;
  /** Active NPC↔NPC pair thread. */
  npcConvo: NpcConvoState | null;
  isNpcInConvo: (npcId: string) => boolean;
  handleRoomChat: (sender: string, text: string) => void;
  handleNpcShout: (npcId: string, text: string) => void;
  handleNpcLine: (
    convoId: string,
    npc: string,
    text: string,
    participants?: [string, string],
  ) => void;
  onNpcConvoStart: (convoId: string, participants: [string, string]) => void;
  onNpcConvoEnd: (convoId: string) => void;
};

function parseSender(sender: string): { kind: 'user' | 'npc'; id: string } | null {
  if (sender.startsWith('user:')) return { kind: 'user', id: sender.slice(5) };
  if (sender.startsWith('npc:')) return { kind: 'npc', id: sender.slice(4) };
  return null;
}

/**
 * Tracks server-paced public room chat — pair convos use one unified thread.
 */
export function useRoomChatter(
  resolvePlayerId: (nameOrId: string) => string | null,
): RoomChatterState {
  const [npcMessages, setNpcMessages] = useState<Map<string, ChatLine[]>>(new Map());
  const [playerMessages, setPlayerMessages] = useState<Map<string, ChatLine[]>>(new Map());
  const [npcConvo, setNpcConvo] = useState<NpcConvoState | null>(null);
  const hideTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const cancelHide = useCallback((key: string) => {
    const prev = hideTimers.current.get(key);
    if (prev) {
      clearTimeout(prev);
      hideTimers.current.delete(key);
    }
  }, []);

  const scheduleHide = useCallback((key: string, ms: number, clear: () => void) => {
    cancelHide(key);
    hideTimers.current.set(
      key,
      setTimeout(() => {
        hideTimers.current.delete(key);
        clear();
      }, ms),
    );
  }, [cancelHide]);

  const appendPlayer = useCallback((playerKey: string, text: string) => {
    setPlayerMessages(prev => {
      const next = new Map(prev);
      next.set(playerKey, appendChatLine(prev.get(playerKey) ?? [], text));
      return next;
    });
    scheduleHide(`player:${playerKey}`, PLAYER_AMBIENT_VISIBLE_MS, () => {
      setPlayerMessages(prev => {
        if (!prev.has(playerKey)) return prev;
        const next = new Map(prev);
        next.delete(playerKey);
        return next;
      });
    });
  }, [scheduleHide]);

  const appendNpcShout = useCallback((npcId: string, text: string) => {
    setNpcMessages(prev => {
      const next = new Map(prev);
      next.set(npcId, appendChatLine(prev.get(npcId) ?? [], text));
      return next;
    });
    const visibleMs = AMBIENT_VISIBLE_MS + Math.random() * AMBIENT_VISIBLE_JITTER_MS;
    scheduleHide(`npc:${npcId}`, visibleMs, () => {
      setNpcMessages(prev => {
        if (!prev.has(npcId)) return prev;
        const next = new Map(prev);
        next.delete(npcId);
        return next;
      });
    });
  }, [scheduleHide]);

  const handleNpcShout = useCallback((npcId: string, text: string) => {
    if (npcConvo?.participants.includes(npcId)) return;
    appendNpcShout(npcId, stripNpcChatterDots(text));
  }, [appendNpcShout, npcConvo]);

  const handleRoomChat = useCallback((sender: string, text: string) => {
    const parsed = parseSender(sender);
    if (!parsed) return;
    if (parsed.kind === 'npc') return;
    const playerId = resolvePlayerId(parsed.id);
    if (playerId) appendPlayer(playerId, text);
  }, [appendPlayer, resolvePlayerId]);

  const handleNpcLine = useCallback((
    convoId: string,
    npc: string,
    text: string,
    participants?: [string, string],
  ) => {
    cancelHide(`npc-convo:${convoId}`);
    setNpcConvo(prev => {
      let base = prev?.convoId === convoId ? prev : null;
      if (!base) {
        if (!participants?.includes(npc)) return prev;
        base = { convoId, participants, lines: [] };
      }
      if (!base.participants.includes(npc)) return prev;
      const cleaned = stripNpcChatterDots(text);
      const last = base.lines[base.lines.length - 1];
      if (
        last?.speakerKey === npc
        && stripNpcChatterDots(last.text).toLowerCase() === cleaned.toLowerCase()
      ) {
        return prev;
      }
      const line = createChatLine(cleaned);
      return {
        ...base,
        lines: [...base.lines, { ...line, speakerKey: npc }].slice(-6),
      };
    });
  }, [cancelHide]);

  const onNpcConvoStart = useCallback((convoId: string, participants: [string, string]) => {
    cancelHide(`npc-convo:${convoId}`);
    setNpcConvo(prev => (prev?.convoId === convoId ? prev : { convoId, participants, lines: [] }));
    setNpcMessages(prev => {
      const next = new Map(prev);
      for (const id of participants) next.delete(id);
      return next;
    });
  }, [cancelHide]);

  const onNpcConvoEnd = useCallback((convoId: string) => {
    scheduleHide(`npc-convo:${convoId}`, NPC_PAIR_CHAT_LINGER_MS, () => {
      setNpcConvo(prev => (prev?.convoId === convoId ? null : prev));
      clearNpcConvoAnchor(convoId);
    });
  }, [scheduleHide]);

  const isNpcInConvo = useCallback(
    (npcId: string) => npcConvo?.participants.includes(npcId) ?? false,
    [npcConvo],
  );

  return {
    npcMessages,
    playerMessages,
    npcConvo,
    isNpcInConvo,
    handleRoomChat,
    handleNpcShout,
    handleNpcLine,
    onNpcConvoStart,
    onNpcConvoEnd,
  };
}
