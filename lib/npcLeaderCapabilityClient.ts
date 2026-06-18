'use client';

import {
  normalizeNpcLeaderCapability,
  type NpcLeaderCapability,
} from './npcLeaderCapability';
import { isMobilePresenceViewport } from './presenceBroadcast';

const FPS_SAMPLE_MS = 400;
const FPS_SAMPLE_MAX_WAIT_MS = 350;

/** Quick one-shot rAF fps estimate — resolves undefined when unavailable. */
export function sampleNpcLeaderFps(ms = FPS_SAMPLE_MS): Promise<number | undefined> {
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') {
    return Promise.resolve(undefined);
  }
  return new Promise(resolve => {
    const start = performance.now();
    let frames = 0;
    const tick = (now: number) => {
      frames++;
      if (now - start >= ms) {
        const elapsedSec = (now - start) / 1000;
        resolve(elapsedSec > 0 ? Math.round(frames / elapsedSec) : undefined);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function readNpcLeaderCapability(fps?: number): NpcLeaderCapability {
  const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency
    : 2;
  return normalizeNpcLeaderCapability({
    cores,
    mobile: isMobilePresenceViewport(),
    fps,
  });
}

/** Sample fps (when possible) and return normalized capability. */
export async function prepareNpcLeaderCapability(): Promise<NpcLeaderCapability> {
  const fps = await sampleNpcLeaderFps();
  return readNpcLeaderCapability(fps);
}

/** Wait briefly for an in-flight fps sample before joining the room. */
export async function awaitNpcLeaderCapability(
  resolvedRef: { current: NpcLeaderCapability | null },
  pending: Promise<void> | null,
  maxWaitMs = FPS_SAMPLE_MAX_WAIT_MS,
): Promise<NpcLeaderCapability> {
  if (resolvedRef.current) return resolvedRef.current;
  if (pending) {
    await Promise.race([
      pending,
      new Promise<void>(resolve => { setTimeout(resolve, maxWaitMs); }),
    ]);
  }
  return resolvedRef.current ?? readNpcLeaderCapability();
}
