import type { ReactNode } from 'react';

/** Held / worn item rendered on a character (replaces the default balloon). */
export type CharacterAccessory =
  | { type: 'balloon'; color: string }
  | { type: 'lightsaber'; bladeColor?: string; hiltColor?: string }
  | { type: 'globe'; color: string }
  | { type: 'guitar'; color: string }
  | { type: 'chefHat'; color: string }
  | { type: 'compass'; color: string }
  | { type: 'microphone'; color: string }
  | { type: 'dj'; headphoneColor?: string; speakerColor?: string }
  | { type: 'necklace'; symbol?: string; color: string; chainColor?: string; balloonColor?: string }
  | { type: 'vendorCart'; color: string; emoji?: string }
  | { type: 'pirate' }
  | { type: 'support' }
  | { type: 'undercoverCop' }
  | { type: 'none' };

export type AccessoryType = CharacterAccessory['type'];

export type ColoredProp = Exclude<CharacterAccessory, { type: 'lightsaber' }>['type'];

/** Mount points on the character body that an accessory can render into. */
export type AccessorySlot = 'float' | 'head' | 'hand';

export type RenderCtx = { balloonColor: string };

export type AccessoryDefinition = {
  /** Hand that visibly holds the item (party mode animates the other hand). */
  holdSide: 'left' | 'right';
  /** True when the item occupies a hand (vs. a floating / worn item). */
  handMounted: boolean;
  /** Per-slot renderers. Slots omitted here simply render nothing. */
  slots: Partial<Record<AccessorySlot, (accessory: CharacterAccessory, ctx: RenderCtx) => ReactNode>>;
};
