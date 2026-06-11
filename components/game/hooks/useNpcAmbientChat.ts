'use client';

import { useEffect, useRef, useState } from 'react';
import type { CharacterDef } from '@/components/game/characters';
import { appendChatLine, type ChatLine } from '@/lib/chatLines';
import {
  getAmbientInitialDelayMs,
  getAmbientIntervalMs,
  getAmbientVisibleMs,
  pickAmbientMumble,
} from '@/lib/npcAmbientChat';

export type NpcAmbientChatState = {
  messages: ChatLine[];
};

function randomIntervalMs(characterId: string) {
  const { minMs, maxMs } = getAmbientIntervalMs(characterId);
  return minMs + Math.random() * (maxMs - minMs);
}

function initialDelayMs(npcCast: CharacterDef[], npcIndex: number) {
  const character = npcCast[npcIndex];
  if (!character) return 12_000;
  return getAmbientInitialDelayMs(character.id, npcIndex, character.entryDelay);
}

/**
 * Schedules ambient self-talk for each NPC (Buz shouts more often).
 * Local template lines only — stage acts from synced YouTube playlists.
 */
export function useNpcAmbientChat(npcCast: CharacterDef[], paused: boolean) {
  const npcCount = npcCast.length;
  const [ambientChats, setAmbientChats] = useState<NpcAmbientChatState[]>(() =>
    Array.from({ length: npcCount }, () => ({ messages: [] })),
  );

  const pausedRef = useRef(paused);
  const hideTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  pausedRef.current = paused;

  useEffect(() => {
    const scheduleTimers: ReturnType<typeof setTimeout>[] = [];

    const clearHide = (index: number) => {
      const t = hideTimersRef.current.get(index);
      if (t) clearTimeout(t);
      hideTimersRef.current.delete(index);
    };

    const hideBubbles = (index: number) => {
      clearHide(index);
      setAmbientChats(prev => {
        if (!prev[index]?.messages.length) return prev;
        const next = [...prev];
        next[index] = { messages: [] };
        return next;
      });
    };

    const showBubble = (index: number, message: string, characterId: string) => {
      clearHide(index);
      setAmbientChats(prev => {
        const next = [...prev];
        next[index] = {
          messages: appendChatLine(prev[index]?.messages ?? [], message),
        };
        return next;
      });
      const visibleMs = getAmbientVisibleMs(characterId);
      const visible = visibleMs.baseMs + Math.random() * visibleMs.jitterMs;
      hideTimersRef.current.set(
        index,
        setTimeout(() => hideBubbles(index), visible),
      );
    };

    const mumble = (index: number) => {
      if (pausedRef.current) return;

      const character = npcCast[index];
      if (!character) return;

      showBubble(index, pickAmbientMumble(character), character.id);
    };

    const scheduleNpc = (index: number, delayMs: number) => {
      const characterId = npcCast[index]?.id ?? '';
      const timer = setTimeout(() => {
        mumble(index);
        const loop = () => {
          const next = setTimeout(() => {
            mumble(index);
            loop();
          }, randomIntervalMs(characterId));
          scheduleTimers.push(next);
        };
        loop();
      }, delayMs);
      scheduleTimers.push(timer);
    };

    for (let i = 0; i < npcCount; i++) {
      scheduleNpc(i, initialDelayMs(npcCast, i));
    }

    return () => {
      scheduleTimers.forEach(clearTimeout);
      hideTimersRef.current.forEach(clearTimeout);
      hideTimersRef.current.clear();
    };
  }, [npcCast]);

  useEffect(() => {
    if (!paused) return;
    hideTimersRef.current.forEach(clearTimeout);
    hideTimersRef.current.clear();
    setAmbientChats(prev => prev.map(() => ({ messages: [] })));
  }, [paused]);

  return ambientChats;
}
