import type { CharacterAccessory } from '../types';
import type { CharacterLoadout } from './types';

/**
 * Map legacy single `accessory` NPC props into loadout slots.
 * New characters should set `loadout` directly.
 */
export function loadoutFromAccessory(
  accessory: CharacterAccessory | undefined,
  balloonColor: string,
): CharacterLoadout {
  const base: CharacterLoadout = { balloonColor, hand: 'hand-balloon' };
  if (!accessory) return base;

  switch (accessory.type) {
    case 'balloon':
      return { ...base, hand: 'hand-balloon', balloonColor: accessory.color };
    case 'microphone':
      return { ...base, hand: 'hand-microphone' };
    case 'lightsaber':
      return { ...base, hand: 'hand-lightsaber' };
    case 'necklace':
      return {
        ...base,
        necklace: 'necklace-pendant',
        hand: accessory.balloonColor ? 'hand-balloon' : null,
        balloonColor: accessory.balloonColor ?? balloonColor,
      };
    case 'chefHat':
      return { ...base, hat: 'hat-chef' };
    case 'dj':
      return { ...base, hat: 'hat-cap', hand: 'hand-microphone' };
    case 'pirate':
      return { ...base, hat: 'hat-cap', hand: 'hand-lightsaber', top: 'top-tee' };
    case 'vendorCart':
      return { ...base, hand: 'hand-balloon' };
    default:
      return { ...base, hand: 'hand-balloon' };
  }
}
