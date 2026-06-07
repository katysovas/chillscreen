import type { CharacterAccessory } from './types';

export type PlayerVariantId = 'main' | 'pirate';

export type PlayerVariant = {
  id: PlayerVariantId;
  label: string;
  balloonColor: string;
  accessory?: CharacterAccessory;
  /** Extra class on .ch-wrapper — tie-dye shirt, neon tank, etc. */
  outfit?: string;
};

export const PLAYER_VARIANTS: PlayerVariant[] = [
  {
    id: 'main',
    label: 'Main',
    balloonColor: '#ef4023',
  },
  {
    id: 'pirate',
    label: 'Pirate',
    balloonColor: '#8b4513',
    outfit: 'pirate',
    accessory: { type: 'pirate' },
  },
];

export function playerVariantById(id: PlayerVariantId): PlayerVariant {
  return PLAYER_VARIANTS.find(v => v.id === id) ?? PLAYER_VARIANTS[0]!;
}
