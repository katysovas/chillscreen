import { INSTRUMENT_ITEMS } from '@/lib/vendorShop';
import type { CharacterLoadout } from './types';

/** Stable instrument pick per NPC — same id always gets the same prop. */
export function npcInstrumentHandForId(npcId: string): string {
  let h = 0;
  for (let i = 0; i < npcId.length; i++) {
    h = (Math.imul(31, h) + npcId.charCodeAt(i)) >>> 0;
  }
  return INSTRUMENT_ITEMS[h % INSTRUMENT_ITEMS.length]!;
}

/** Replace the default heart balloon with a crowd instrument prop. */
export function swapNpcBalloonForInstrument(
  loadout: CharacterLoadout,
  npcId: string,
): CharacterLoadout {
  const hand = loadout.hand ?? 'hand-balloon';
  if (hand !== 'hand-balloon') return loadout;
  return { ...loadout, hand: npcInstrumentHandForId(npcId) };
}
