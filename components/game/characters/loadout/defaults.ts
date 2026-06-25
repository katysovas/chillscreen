import type { CharacterDef } from '@/components/game/characters';
import type { CharacterAccessory } from '../types';
import type { CharacterLoadout } from './types';
import { swapNpcBalloonForInstrument } from './npcInstruments';

/** Default player appearance — heart balloon, no outfit pieces. */
export function defaultLoadout(balloonColor = '#ef4023'): CharacterLoadout {
  return {
    hand: 'hand-balloon',
    balloonColor,
  };
}

/** Necklace-only looks intentionally clear the hand slot. */
function preserveEmptyHand(partial: CharacterLoadout): boolean {
  return Boolean(partial.necklace) && partial.hand === null;
}

function resolveHandSlot(
  partial: CharacterLoadout,
  baseHand: string,
): string | null | undefined {
  if (partial.hand === undefined) return baseHand;
  if (partial.hand === null && !preserveEmptyHand(partial)) return baseHand;
  return partial.hand;
}

/** Merge saved loadout with defaults (keeps balloon color when omitted). */
export function normalizeLoadout(
  partial: CharacterLoadout | undefined,
  balloonColor: string,
): CharacterLoadout {
  const base = defaultLoadout(balloonColor);
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    balloonColor: partial.balloonColor ?? balloonColor,
    hand: resolveHandSlot(partial, base.hand ?? 'hand-balloon'),
  };
}

/**
 * NPC crowd appearance — normalize loadout and swap the default balloon
 * for a stable random instrument when no legacy accessory override is set.
 */
export function npcDisplayLoadout(
  loadout: CharacterLoadout | undefined,
  accessory: CharacterAccessory | undefined,
  balloonColor: string,
  npcId: string,
): CharacterLoadout | undefined {
  if (accessory) return loadout;
  const normalized = normalizeLoadout(loadout, balloonColor);
  return swapNpcBalloonForInstrument(normalized, npcId);
}

/** Bake instrument swap into a cast entry (idempotent). */
export function finalizeNpcCharacterDef(cfg: CharacterDef): CharacterDef {
  if (cfg.accessory) return cfg;
  return {
    ...cfg,
    loadout: swapNpcBalloonForInstrument(
      normalizeLoadout(cfg.loadout, cfg.balloonColor),
      cfg.id,
    ),
  };
}

export function finalizeNpcCast(cast: CharacterDef[]): CharacterDef[] {
  return cast.map(finalizeNpcCharacterDef);
}
