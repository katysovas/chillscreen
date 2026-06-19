'use client';

import { useSyncExternalStore } from 'react';
import { Z_AMBIENT_CHAT, Z_CHAT_OVERLAY } from '@/lib/zLayers';

/** Entity key with the most recent public chat activity — wins cross-character stacking. */
let topKey: string | null = null;
const listeners = new Set<() => void>();

export function bumpPublicChatBubbleLayer(key: string): void {
  topKey = key;
  for (const notify of listeners) notify();
}

export function subscribePublicChatBubbleLayer(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

/** z-index for a character or overlay hosting ambient/public chat bubbles. */
export function publicChatBubbleLayerZ(key: string, depthZ: number): number {
  const base = Math.max(depthZ, Z_AMBIENT_CHAT);
  if (topKey !== key) return base;
  return Math.max(base, Z_CHAT_OVERLAY);
}

export function usePublicChatBubbleZ(key: string, depthZ: number): number {
  return useSyncExternalStore(
    subscribePublicChatBubbleLayer,
    () => publicChatBubbleLayerZ(key, depthZ),
    () => Math.max(depthZ, Z_AMBIENT_CHAT),
  );
}
