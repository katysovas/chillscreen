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

/** Pull a pair together and pin world-x so wander AI cannot walk them apart mid-convo. */
export function snapNpcPairForConvo(
  idA: string,
  idB: string,
  viewportWidth: number,
  ctx: SnapContext,
): void {
  const idxA = ctx.npcCast.findIndex(c => c.id === idA);
  const idxB = ctx.npcCast.findIndex(c => c.id === idB);
  if (idxA < 0 || idxB < 0) return;

  let wxA = ctx.npcWorldXRefs.current[idxA]!;
  let wxB = ctx.npcWorldXRefs.current[idxB]!;
  if (!Number.isFinite(wxA) && Number.isFinite(wxB)) wxA = wxB;
  if (!Number.isFinite(wxB) && Number.isFinite(wxA)) wxB = wxA;
  if (!Number.isFinite(wxA) || !Number.isFinite(wxB)) return;

  const mid = (wxA + wxB) / 2;
  const gap = Math.max(npcTouchDistPx(viewportWidth) * 1.4, 48);
  const holdA = mid - gap / 2;
  const holdB = mid + gap / 2;

  setNpcConvoHold(idA, holdA);
  setNpcConvoHold(idB, holdB);
  ctx.npcWorldXRefs.current[idxA] = holdA;
  ctx.npcWorldXRefs.current[idxB] = holdB;
}

export function releaseNpcConvoSnap(): void {
  scheduleNpcConvoRelease(jitterMs(CONVO_RELEASE_MIN_MS, CONVO_RELEASE_MAX_MS));
}
