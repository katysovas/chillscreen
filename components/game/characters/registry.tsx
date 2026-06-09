import type { ReactNode } from 'react';
import { ColoredPropAccessory } from './accessories/coloredProp/accessory';
import { DjHeadphones, DjSpeaker } from './accessories/dj/accessory';
import { LightsaberAccessory } from './accessories/lightsaber/accessory';
import { MicrophoneAccessory } from './accessories/microphone/accessory';
import { NecklaceAccessory } from './accessories/necklace/accessory';
import { SupportHeadAccessory } from './accessories/support/accessory';
import {
  UndercoverCopHandAccessory,
  UndercoverCopHeadAccessory,
} from './undercoverCop/accessory';
import { VendorCartAccessory } from './accessories/vendorCart/accessory';
import { BalloonAccessory } from './main/accessory';
import { PirateHeadAccessory, PirateSwordAccessory } from './pirate/accessory';
import type {
  AccessoryDefinition,
  AccessorySlot,
  AccessoryType,
  CharacterAccessory,
  RenderCtx,
} from './types';

/** Authoring helper — narrows `accessory` to the concrete variant per entry. */
function define<T extends AccessoryType>(def: {
  holdSide?: 'left' | 'right';
  handMounted?: boolean;
  slots: Partial<
    Record<AccessorySlot, (accessory: Extract<CharacterAccessory, { type: T }>, ctx: RenderCtx) => ReactNode>
  >;
}): AccessoryDefinition {
  return {
    holdSide: def.holdSide ?? 'right',
    handMounted: def.handMounted ?? false,
    slots: def.slots as AccessoryDefinition['slots'],
  };
}

export const ACCESSORY_LIBRARY: Record<AccessoryType, AccessoryDefinition> = {
  balloon: define<'balloon'>({
    slots: { float: a => <BalloonAccessory color={a.color} /> },
  }),
  globe: define<'globe'>({
    slots: { float: a => <ColoredPropAccessory type="globe" color={a.color} /> },
  }),
  guitar: define<'guitar'>({
    slots: { float: a => <ColoredPropAccessory type="guitar" color={a.color} /> },
  }),
  chefHat: define<'chefHat'>({
    slots: { float: a => <ColoredPropAccessory type="chefHat" color={a.color} /> },
  }),
  compass: define<'compass'>({
    slots: { float: a => <ColoredPropAccessory type="compass" color={a.color} /> },
  }),
  lightsaber: define<'lightsaber'>({
    handMounted: true,
    slots: { hand: a => <LightsaberAccessory bladeColor={a.bladeColor} hiltColor={a.hiltColor} /> },
  }),
  microphone: define<'microphone'>({
    handMounted: true,
    slots: { hand: a => <MicrophoneAccessory color={a.color} /> },
  }),
  dj: define<'dj'>({
    handMounted: true,
    slots: {
      head: a => <DjHeadphones color={a.headphoneColor} />,
      hand: a => <DjSpeaker color={a.speakerColor} />,
    },
  }),
  necklace: define<'necklace'>({
    slots: {
      head: a => <NecklaceAccessory symbol={a.symbol} color={a.color} chainColor={a.chainColor} />,
      float: a => (a.balloonColor ? <BalloonAccessory color={a.balloonColor} /> : null),
    },
  }),
  vendorCart: define<'vendorCart'>({
    holdSide: 'right',
    slots: {
      float: a => <VendorCartAccessory color={a.color} emoji={a.emoji} />,
    },
  }),
  pirate: define<'pirate'>({
    handMounted: true,
    slots: {
      head: () => <PirateHeadAccessory />,
      hand: () => <PirateSwordAccessory />,
    },
  }),
  support: define<'support'>({
    slots: {
      head: () => <SupportHeadAccessory />,
    },
  }),
  undercoverCop: define<'undercoverCop'>({
    handMounted: true,
    slots: {
      head: () => <UndercoverCopHeadAccessory />,
      hand: () => <UndercoverCopHandAccessory />,
    },
  }),
  none: define<'none'>({ slots: {} }),
};
