'use client';

import { useEffect, useRef, useState } from 'react';
import CHARACTERS from '@/components/game/characters';
import {
  getAmbientInitialDelayMs,
  getAmbientIntervalMs,
  getAmbientVisibleMs,
  pickAmbientMumble,
} from '@/lib/npcAmbientChat';

export type NpcAmbientChatState = {
  message: string | null;
};

function randomIntervalMs(characterId: string) {
  const { minMs, maxMs } = getAmbientIntervalMs(characterId);
  return minMs + Math.random() * (maxMs - minMs);
}

function initialDelayMs(npcIndex: number) {
  const character = CHARACTERS[npcIndex];
  if (!character) return 12_000;
  return getAmbientInitialDelayMs(character.id, npcIndex, character.entryDelay);
}

/**
 * Schedules ambient self-talk for each NPC (Buz shouts more often).
 * Local template lines only — stage acts from synced YouTube playlists.
 */
export function useNpcAmbientChat(npcCount: number, paused: boolean) {
  const [ambientChats, setAmbientChats] = useState<NpcAmbientChatState[]>(() =>
    Array.from({ length: npcCount }, () => ({ message: null })),
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

    const hideBubble = (index: number) => {
      clearHide(index);
      setAmbientChats(prev => {
        if (!prev[index]?.message) return prev;
        const next = [...prev];
        next[index] = { message: null };
        return next;
      });
    };

    const showBubble = (index: number, message: string, characterId: string) => {
      clearHide(index);
      setAmbientChats(prev => {
        const next = [...prev];
        next[index] = { message };
        return next;
      });
      const visibleMs = getAmbientVisibleMs(characterId);
      const visible = visibleMs.baseMs + Math.random() * visibleMs.jitterMs;
      hideTimersRef.current.set(
        index,
        setTimeout(() => hideBubble(index), visible),
      );
    };

    const mumble = (index: number) => {
      if (pausedRef.current) return;

      const character = CHARACTERS[index];
      if (!character) return;

      showBubble(index, pickAmbientMumble(character), character.id);
    };

    const scheduleNpc = (index: number, delayMs: number) => {
      const characterId = CHARACTERS[index]?.id ?? '';
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
      scheduleNpc(i, initialDelayMs(i));
    }

    return () => {
      scheduleTimers.forEach(clearTimeout);
      hideTimersRef.current.forEach(clearTimeout);
      hideTimersRef.current.clear();
    };
  }, [npcCount]);

  useEffect(() => {
    if (!paused) return;
    hideTimersRef.current.forEach(clearTimeout);
    hideTimersRef.current.clear();
    setAmbientChats(prev => prev.map(() => ({ message: null })));
  }, [paused]);

  return ambientChats;
}
