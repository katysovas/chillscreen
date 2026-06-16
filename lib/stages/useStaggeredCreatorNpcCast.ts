'use client';

import { useEffect, useMemo, useState } from 'react';
import { STAGE_CONFIG } from '@/lib/stages/config';
import type { CharacterDef } from '@/components/game/characters';

const INTRO_SEEN_KEY_PREFIX = 'whichstage:creator-npc-intro:';

function creatorNpcIntroSeen(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(`${INTRO_SEEN_KEY_PREFIX}${slug}`) === '1';
  } catch {
    return false;
  }
}

function markCreatorNpcIntroSeen(slug: string): void {
  try {
    sessionStorage.setItem(`${INTRO_SEEN_KEY_PREFIX}${slug}`, '1');
  } catch {
    /* ignore */
  }
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Gradually reveal 3–5 ambient NPCs on creator stage entry (visual-only).
 * Stagger runs once per stage per browser tab; reloads show the full crowd immediately.
 */
export function useStaggeredCreatorNpcCast(
  fullCast: CharacterDef[],
  enabled: boolean,
  seed: number,
  stageSlug: string | null = null,
): CharacterDef[] {
  const skipStagger = Boolean(stageSlug && creatorNpcIntroSeen(stageSlug));
  const [visibleCount, setVisibleCount] = useState(0);

  const targetCount = useMemo(() => {
    const rng = mulberry32(seed);
    const min = STAGE_CONFIG.NPC_SPAWN_COUNT_MIN;
    const max = STAGE_CONFIG.NPC_SPAWN_COUNT_MAX;
    return min + Math.floor(rng() * (max - min + 1));
  }, [seed]);

  const delays = useMemo(() => {
    const rng = mulberry32(seed + 9001);
    const out: number[] = [];
    let acc = 0;
    for (let i = 0; i < targetCount; i++) {
      const gap = STAGE_CONFIG.NPC_SPAWN_DELAY_MIN_MS
        + rng() * (STAGE_CONFIG.NPC_SPAWN_DELAY_MAX_MS - STAGE_CONFIG.NPC_SPAWN_DELAY_MIN_MS);
      acc += gap;
      out.push(acc);
    }
    return out;
  }, [seed, targetCount]);

  useEffect(() => {
    if (!enabled) {
      setVisibleCount(0);
      return;
    }
    if (skipStagger) {
      setVisibleCount(targetCount);
      return;
    }
    setVisibleCount(0);
    const timers = delays.map((ms, i) =>
      window.setTimeout(() => {
        const next = i + 1;
        setVisibleCount(next);
        if (stageSlug && next >= targetCount) {
          markCreatorNpcIntroSeen(stageSlug);
        }
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [enabled, delays, skipStagger, stageSlug, targetCount]);

  return useMemo(() => {
    if (!enabled) return [];
    const cap = Math.min(targetCount, fullCast.length);
    if (skipStagger) return fullCast.slice(0, cap);
    if (visibleCount === 0) return [];
    return fullCast.slice(0, Math.min(visibleCount, cap));
  }, [enabled, skipStagger, visibleCount, targetCount, fullCast]);
}
