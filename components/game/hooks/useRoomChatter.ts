'use client';

import { useCallback, useRef, useState } from 'react';
import { appendChatLine, createChatLine, type ChatLine, type KeyedChatLine } from '@/lib/chatLines';
import { PLAYER_AMBIENT_VISIBLE_MS } from '@/lib/multiplayer/useMultiplayer';

const NPC_BUBBLE_VISIBLE_MS = 8_000;

export type NpcConvoState = {
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
  handleNpcLine: (npc: string, text: string) => void;
  onNpcConvoStart: (participants: [string, string]) => void;
  onNpcConvoEnd: () => void;
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
  const [npcConvoSet, setNpcConvoSet] = useState<Set<string>>(new Set());
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

  const appendNpcSolo = useCallback((npcId: string, text: string) => {
    setNpcMessages(prev => {
      const next = new Map(prev);
      next.set(npcId, appendChatLine(prev.get(npcId) ?? [], text));
      return next;
    });
    scheduleHide(`npc:${npcId}`, NPC_BUBBLE_VISIBLE_MS, () => {
      setNpcMessages(prev => {
        if (!prev.has(npcId)) return prev;
        const next = new Map(prev);
        next.delete(npcId);
        return next;
      });
    });
  }, [scheduleHide]);

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
    if (parsed.kind === 'npc') {
      appendNpcSolo(parsed.id, text);
      return;
    }
    const playerId = resolvePlayerId(parsed.id);
    if (playerId) appendPlayer(playerId, text);
  }, [appendNpcSolo, appendPlayer, resolvePlayerId]);

  const handleNpcLine = useCallback((npc: string, text: string) => {
    let inPairConvo = false;
    setNpcConvo(prev => {
      if (prev?.participants.includes(npc)) {
        inPairConvo = true;
        const line = createChatLine(text);
        return {
          ...prev,
          lines: [...prev.lines, { ...line, speakerKey: npc }].slice(-6),
        };
      }
      return prev;
    });
    if (!inPairConvo) appendNpcSolo(npc, text);
  }, [appendNpcSolo]);

  const onNpcConvoStart = useCallback((participants: [string, string]) => {
    setNpcConvoSet(new Set(participants));
    setNpcConvo({ participants, lines: [] });
    setNpcMessages(prev => {
      const next = new Map(prev);
      for (const id of participants) next.delete(id);
      return next;
    });
  }, []);

  const onNpcConvoEnd = useCallback(() => {
    setNpcConvoSet(new Set());
    setNpcConvo(null);
  }, []);

  const isNpcInConvo = useCallback(
    (npcId: string) => npcConvoSet.has(npcId),
    [npcConvoSet],
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
