import type { ReactNode } from 'react';
import { defaultAccessory } from './defaultAccessory';
import { ACCESSORY_LIBRARY } from './registry';
import type { AccessorySlot, CharacterAccessory } from './types';

function resolve(accessory: CharacterAccessory | undefined, balloonColor: string) {
  const item = accessory ?? defaultAccessory(balloonColor);
  return { item, def: ACCESSORY_LIBRARY[item.type] };
}

/** Render whatever a character's accessory contributes to the given slot. */
export function renderAccessorySlot(
  slot: AccessorySlot,
  accessory: CharacterAccessory | undefined,
  balloonColor: string,
): ReactNode {
  const { item, def } = resolve(accessory, balloonColor);
  const render = def?.slots[slot];
  return render ? render(item, { balloonColor }) : null;
}

/** Side that holds the visible accessory (party mode animates the other). */
export function accessoryHoldSide(accessory: CharacterAccessory | undefined): 'left' | 'right' {
  return accessory ? ACCESSORY_LIBRARY[accessory.type]?.holdSide ?? 'right' : 'right';
}

/** True when the accessory is held in a hand (lightsaber / mic / dj boombox). */
export function isHandMountedAccessory(accessory: CharacterAccessory | undefined): boolean {
  return !!accessory && (ACCESSORY_LIBRARY[accessory.type]?.handMounted ?? false);
}
