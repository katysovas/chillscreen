export type {
  CharacterLoadout,
  LoadoutItemDef,
  LoadoutItemProps,
  LoadoutRenderCtx,
  LoadoutSlot,
} from './types';
export { LOADOUT_SLOTS, loadoutItemId } from './types';

export { LOADOUT_CATALOG, catalogForSlot, loadoutItem } from './catalog';
export {
  buildRenderCtx,
  isLoadoutHandMounted,
  loadoutHoldSide,
  renderLoadoutItem,
  renderLoadoutSlot,
} from './registry';
export {
  renderLoadoutBottom,
  renderLoadoutFloat,
  renderLoadoutHand,
  renderLoadoutHat,
  renderLoadoutNecklace,
  renderLoadoutSunglasses,
  renderLoadoutTop,
  resolveLoadout,
} from './renderLayers';
export { defaultLoadout, normalizeLoadout } from './defaults';
export { loadoutFromAccessory } from './bridge';
export { LOADOUT_STYLES } from './styles';
