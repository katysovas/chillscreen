'use client';

import { useEffect, useRef, useState } from 'react';
import CHARACTERS from '@/components/game/characters';
import {
  AMBIENT_INTERVAL_MAX_MS,
  AMBIENT_INTERVAL_MIN_MS,
  AMBIENT_VISIBLE_JITTER_MS,
  AMBIENT_VISIBLE_MS,
  pickAmbientMumble,
} from '@/lib/npcAmbientChat';

export type NpcAmbientChatState = {
  message: string | null;
};

function randomIntervalMs() {
  return (
    AMBIENT_INTERVAL_MIN_MS +
    Math.random() * (AMBIENT_INTERVAL_MAX_MS - AMBIENT_INTERVAL_MIN_MS)
  );
}

function initialDelayMs(npcIndex: number) {
  const entry = CHARACTERS[npcIndex]?.entryDelay ?? 0;
  return 12_000 + entry * 0.35 + npcIndex * 4_500 + Math.random() * 8_000;
}

/**
 * Schedules ambient self-talk for each NPC (~once per minute each).
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

    const showBubble = (index: number, message: string) => {
      clearHide(index);
      setAmbientChats(prev => {
        const next = [...prev];
        next[index] = { message };
        return next;
      });
      const visible =
        AMBIENT_VISIBLE_MS + Math.random() * AMBIENT_VISIBLE_JITTER_MS;
      hideTimersRef.current.set(
        index,
        setTimeout(() => hideBubble(index), visible),
      );
    };

    const mumble = (index: number) => {
      if (pausedRef.current) return;

      const character = CHARACTERS[index];
      if (!character) return;

      showBubble(index, pickAmbientMumble(character));
    };

    const scheduleNpc = (index: number, delayMs: number) => {
      const timer = setTimeout(() => {
        mumble(index);
        const loop = () => {
          const next = setTimeout(() => {
            mumble(index);
            loop();
          }, randomIntervalMs());
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
