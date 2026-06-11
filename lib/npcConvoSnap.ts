import type { MutableRefObject } from 'react';
import type { CharacterDef } from '@/components/game/characters';
import { clearNpcConvoHolds, setNpcConvoHold } from '@/lib/npcConvoHold';
import { npcTouchDistPx } from '@/lib/npcProximity';

type SnapContext = {
  npcCast: CharacterDef[];
  npcWorldXRefs: MutableRefObject<number[]>;
};

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
  clearNpcConvoHolds();
}
