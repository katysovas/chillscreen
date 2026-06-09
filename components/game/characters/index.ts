export type {
  AccessoryDefinition,
  AccessorySlot,
  AccessoryType,
  CharacterAccessory,
  ColoredProp,
  RenderCtx,
} from './types';

export { defaultAccessory } from './defaultAccessory';
export { ACCESSORY_LIBRARY } from './registry';
export {
  accessoryHoldSide,
  isHandMountedAccessory,
  renderAccessorySlot,
} from './render';

export { CHARACTER_STYLES } from './styles';
export { PLAYER_VARIANTS, playerVariantById } from './playerVariants';
export type { PlayerVariant, PlayerVariantId } from './playerVariants';

export { default as Character } from './shared/Character';
export type { CharacterHandle, CharacterProps } from './shared/Character';

export { BalloonAccessory } from './main/accessory';
export { ColoredPropAccessory } from './accessories/coloredProp/accessory';
export { DjHeadphones, DjSpeaker } from './accessories/dj/accessory';
export { LightsaberAccessory } from './accessories/lightsaber/accessory';
export { MicrophoneAccessory } from './accessories/microphone/accessory';
export { NecklaceAccessory } from './accessories/necklace/accessory';
export { PirateHeadAccessory, PirateSwordAccessory } from './pirate/accessory';
export { SupportHeadAccessory } from './accessories/support/accessory';
export { VendorCartAccessory } from './accessories/vendorCart/accessory';

export type {
  CharacterLoadout,
  LoadoutItemDef,
  LoadoutItemProps,
  LoadoutRenderCtx,
  LoadoutSlot,
} from './loadout';
export {
  LOADOUT_CATALOG,
  LOADOUT_SLOTS,
  catalogForSlot,
  defaultLoadout,
  isLoadoutHandMounted,
  loadoutFromAccessory,
  loadoutHoldSide,
  loadoutItem,
  loadoutItemId,
  normalizeLoadout,
  renderLoadoutItem,
} from './loadout';
