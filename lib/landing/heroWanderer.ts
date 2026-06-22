import { npcCastForVenue } from '@/lib/npcCast';
import { isBuzNpc } from '@/lib/vendorShop';
import type { CharacterDef } from '@/components/game/characters';
import type { VenueRoute } from '@/lib/venueSlugs';

/** Stable on-screen spawn for the landing hero wanderer. */
function landingHeroStartX(seed: number, id: string): number {
  let h = seed;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 22 + (h % 56);
}

/** One generated festie to wander the hero grass — no vendor, no stage crowd pin. */
export function landingHeroWandererForRoute(
  route: VenueRoute,
  ambientSeed: number,
): CharacterDef | null {
  const pick = npcCastForVenue(route, ambientSeed).find(
    c => !c.stageAnchor && !isBuzNpc(c.id),
  );
  if (!pick) return null;

  return {
    ...pick,
    stageAnchor: undefined,
    stageCrowd: undefined,
    startX: landingHeroStartX(ambientSeed, pick.id),
    entryDelay: 0,
    entryDirection: pick.entryDirection ?? 'right',
  };
}
