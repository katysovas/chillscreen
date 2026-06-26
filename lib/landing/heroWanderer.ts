import { npcCastForVenue } from '@/lib/npcCast';
import { hasDrumsEquipped } from '@/components/game/characters/loadout/ownership';
import type { CharacterLoadout } from '@/components/game/characters/loadout';
import { INSTRUMENT_ITEMS, isBuzNpc } from '@/lib/vendorShop';
import type { CharacterDef } from '@/components/game/characters';
import type { VenueRoute } from '@/lib/venueSlugs';

/** Stable on-screen spawn for the landing hero wanderer. */
function landingHeroStartX(seed: number, id: string): number {
  let h = seed;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 22 + (h % 56);
}

function isHeroWandererCandidate(cfg: CharacterDef): boolean {
  return !cfg.stageAnchor && !isBuzNpc(cfg.id);
}

const HERO_FALLBACK_HAND = INSTRUMENT_ITEMS.find(
  id => !id.includes('drums') && !id.includes('bongo'),
)!;

/** Drum kit is too large for the hero grass strip — swap to a hand-held instrument. */
function loadoutWithoutDrums(loadout: CharacterLoadout | undefined): CharacterLoadout | undefined {
  if (!loadout || !hasDrumsEquipped(loadout)) return loadout;
  return { ...loadout, hand: HERO_FALLBACK_HAND };
}

/** One generated festie to wander the hero grass — no vendor, no stage crowd pin. */
export function landingHeroWandererForRoute(
  route: VenueRoute,
  ambientSeed: number,
): CharacterDef | null {
  const cast = npcCastForVenue(route, ambientSeed);
  const pick = cast.find(c => isHeroWandererCandidate(c) && !hasDrumsEquipped(c.loadout))
    ?? cast.find(isHeroWandererCandidate);
  if (!pick) return null;

  const loadout = loadoutWithoutDrums(pick.loadout);

  return {
    ...pick,
    loadout,
    stageAnchor: undefined,
    stageCrowd: undefined,
    startX: landingHeroStartX(ambientSeed, pick.id),
    entryDelay: 0,
    entryDirection: pick.entryDirection ?? 'right',
  };
}
