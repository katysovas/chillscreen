'use client';

import { useCallback, useRef, useState } from 'react';
import { appendChatLine, createChatLine, type ChatLine, type KeyedChatLine } from '@/lib/chatLines';
import { PLAYER_AMBIENT_VISIBLE_MS } from '@/lib/multiplayer/useMultiplayer';

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
  handleNpcLine: (convoId: string, npc: string, text: string) => void;
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

  const scheduleHide = useCallback((key: string, ms: number, clear: () => void) => {
    const prev = hideTimers.current.get(key);
    if (prev) clearTimeout(prev);
    hideTimers.current.set(
      key,
      setTimeout(() => {
        hideTimers.current.delete(key);
        clear();
      }, ms),
    );
  }, []);

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

  const handleRoomChat = useCallback((sender: string, text: string) => {
    const parsed = parseSender(sender);
    if (!parsed) return;
    if (parsed.kind === 'npc') return;
    const playerId = resolvePlayerId(parsed.id);
    if (playerId) appendPlayer(playerId, text);
  }, [appendPlayer, resolvePlayerId]);

  const handleNpcLine = useCallback((convoId: string, npc: string, text: string) => {
    setNpcConvo(prev => {
      if (!prev || prev.convoId !== convoId || !prev.participants.includes(npc)) {
        return prev;
      }
      const line = createChatLine(text);
      return {
        ...prev,
        lines: [...prev.lines, { ...line, speakerKey: npc }].slice(-6),
      };
    });
  }, []);

  const onNpcConvoStart = useCallback((convoId: string, participants: [string, string]) => {
    setNpcConvo(prev => (prev?.convoId === convoId ? prev : { convoId, participants, lines: [] }));
    setNpcMessages(prev => {
      const next = new Map(prev);
      for (const id of participants) next.delete(id);
      return next;
    });
  }, []);

  const onNpcConvoEnd = useCallback((convoId: string) => {
    setNpcConvo(prev => (prev?.convoId === convoId ? null : prev));
  }, []);

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
    handleNpcLine,
    onNpcConvoStart,
    onNpcConvoEnd,
  };
}
