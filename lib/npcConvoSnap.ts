import type { MutableRefObject } from 'react';
import type { CharacterDef } from '@/components/game/characters';
import { scheduleNpcConvoRelease, setNpcConvoHold } from '@/lib/npcConvoHold';
import { npcTouchDistPx } from '@/lib/npcProximity';

const CONVO_RELEASE_MIN_MS = 2_000;
const CONVO_RELEASE_MAX_MS = 3_000;

type SnapContext = {
  npcCast: CharacterDef[];
  npcWorldXRefs: MutableRefObject<number[]>;
};

function jitterMs(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pairHoldPositions(midWorldX: number, viewportWidth: number): [number, number] {
  const gap = Math.max(npcTouchDistPx(viewportWidth) * 1.4, 48);
  return [midWorldX - gap / 2, midWorldX + gap / 2];
}

/** Pin a pair near the player when live movement refs are not ready yet. */
export function pinNpcPairWorldX(
  idA: string,
  idB: string,
  midWorldX: number,
  viewportWidth: number,
): [number, number] {
  const [holdA, holdB] = pairHoldPositions(midWorldX, viewportWidth);
  setNpcConvoHold(idA, holdA);
  setNpcConvoHold(idB, holdB);
  return [holdA, holdB];
}

/** Pull a pair together and pin world-x so wander AI cannot walk them apart mid-convo. */
export function snapNpcPairForConvo(
  idA: string,
  idB: string,
  viewportWidth: number,
  ctx: SnapContext,
  opts?: {
    fallbackMidWorldX?: number;
    /**
     * When set, the pair is always snapped to this world-x regardless of their
     * current positions. Use the current camera offset (worldRef) to center the
     * pair on screen — important on narrow mobile viewports where NPCs near an
     * edge would otherwise place the chat column off-screen.
     */
    forceMidWorldX?: number;
  },
): [number, number] | null {
  const idxA = ctx.npcCast.findIndex(c => c.id === idA);
  const idxB = ctx.npcCast.findIndex(c => c.id === idB);

  let mid: number | null = null;

  if (opts?.forceMidWorldX != null && Number.isFinite(opts.forceMidWorldX)) {
    mid = opts.forceMidWorldX;
  } else {
    let wxA = idxA >= 0 ? ctx.npcWorldXRefs.current[idxA]! : Number.NaN;
    let wxB = idxB >= 0 ? ctx.npcWorldXRefs.current[idxB]! : Number.NaN;
    if (!Number.isFinite(wxA) && Number.isFinite(wxB)) wxA = wxB;
    if (!Number.isFinite(wxB) && Number.isFinite(wxA)) wxB = wxA;

    if (Number.isFinite(wxA) && Number.isFinite(wxB)) {
      mid = (wxA + wxB) / 2;
    } else if (opts?.fallbackMidWorldX != null && Number.isFinite(opts.fallbackMidWorldX)) {
      mid = opts.fallbackMidWorldX;
    }
  }

  if (mid == null) return null;

  const [holdA, holdB] = pinNpcPairWorldX(idA, idB, mid, viewportWidth);
  if (idxA >= 0) ctx.npcWorldXRefs.current[idxA] = holdA;
  if (idxB >= 0) ctx.npcWorldXRefs.current[idxB] = holdB;
  return [holdA, holdB];
}

export function releaseNpcConvoSnap(): void {
  scheduleNpcConvoRelease(jitterMs(CONVO_RELEASE_MIN_MS, CONVO_RELEASE_MAX_MS));
}
