'use client';

import type { StageChatterMessage } from '@/lib/stageChatter/types';

const STORAGE_KEY = 'whichstage.stageChatter.humansOnly';

let cachedHumansOnly: boolean | undefined;
const listeners = new Set<() => void>();

function readHumansOnly(): boolean {
  if (cachedHumansOnly !== undefined) return cachedHumansOnly;
  if (typeof window === 'undefined') return false;
  try {
    cachedHumansOnly = localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    cachedHumansOnly = false;
  }
  return cachedHumansOnly;
}

/** Hide NPC lines in the stage chat panel — saved across all stages. */
export function getHumansOnlyStageChatter(): boolean {
  return readHumansOnly();
}

export function setHumansOnlyStageChatter(value: boolean): void {
  cachedHumansOnly = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    /* private mode */
  }
  for (const fn of listeners) fn();
}

export function subscribeHumansOnlyStageChatter(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function isNpcStageChatterSender(sender: string): boolean {
  return sender.startsWith('npc:');
}

export function filterStageChatterMessages(
  messages: StageChatterMessage[],
  humansOnly: boolean,
): StageChatterMessage[] {
  if (!humansOnly) return messages;
  return messages.filter(m => !isNpcStageChatterSender(m.sender));
}

export function filterStageChatterTypingSenders(
  senders: string[],
  humansOnly: boolean,
): string[] {
  if (!humansOnly) return senders;
  return senders.filter(s => !isNpcStageChatterSender(s));
}
