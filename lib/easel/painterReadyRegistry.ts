'use client';

import { useEffect, useState } from 'react';

/** Client-side: NPC has reached the easel stand (canvas may show + clock runs). */

type Listener = () => void;

const readyByNpc = new Map<string, boolean>();
const listeners = new Set<Listener>();

export function setEaselPainterReady(npcId: string, isReady: boolean): void {
  if (readyByNpc.get(npcId) === isReady) return;
  readyByNpc.set(npcId, isReady);
  listeners.forEach(fn => fn());
}

export function isEaselPainterReady(npcId: string): boolean {
  return readyByNpc.get(npcId) ?? false;
}

export function subscribeEaselPainterReady(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reactive painter-ready flag — false until NPC is stationed at the easel. */
export function useEaselPainterReady(npcId: string, required: boolean): boolean {
  const [ready, setReady] = useState(() => !required || isEaselPainterReady(npcId));

  useEffect(() => {
    if (!required) {
      setReady(true);
      return;
    }
    setReady(isEaselPainterReady(npcId));
    return subscribeEaselPainterReady(() => {
      setReady(isEaselPainterReady(npcId));
    });
  }, [npcId, required]);

  return ready;
}
