'use client';

import type { FestieControlMode } from '@/lib/festie/types';

export type { FestieControlMode };

const STORAGE_KEY = 'whichstage.festie.controlMode';

let cachedMode: FestieControlMode | undefined;
const listeners = new Set<() => void>();

function readMode(): FestieControlMode {
  if (cachedMode !== undefined) return cachedMode;
  if (typeof window === 'undefined') return 'human';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cachedMode = raw === 'ai' ? 'ai' : 'human';
  } catch {
    cachedMode = 'human';
  }
  return cachedMode;
}

export function getFestieControlMode(): FestieControlMode {
  return readMode();
}

export function hydrateFestieControlMode(mode: FestieControlMode | null | undefined): void {
  const next = mode === 'ai' ? 'ai' : 'human';
  if (cachedMode === next) return;
  cachedMode = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode */
  }
  for (const fn of listeners) fn();
}

export function setFestieControlMode(mode: FestieControlMode): void {
  if (cachedMode === mode) return;
  cachedMode = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode */
  }
  for (const fn of listeners) fn();
}

export function subscribeFestieControlMode(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}
