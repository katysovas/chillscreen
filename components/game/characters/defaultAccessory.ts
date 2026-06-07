import type { CharacterAccessory } from './types';

export function defaultAccessory(balloonColor: string): CharacterAccessory {
  return { type: 'balloon', color: balloonColor };
}
