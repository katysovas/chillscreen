import { COLORED_PROP_STYLES } from './accessories/coloredProp/styles';
import { DJ_STYLES } from './accessories/dj/styles';
import { LIGHTSABER_STYLES } from './accessories/lightsaber/styles';
import { MICROPHONE_STYLES } from './accessories/microphone/styles';
import { NECKLACE_STYLES } from './accessories/necklace/styles';
import { VENDOR_CART_STYLES } from './accessories/vendorCart/styles';
import { LOADOUT_STYLES } from './loadout/styles';
import { MAIN_CHARACTER_STYLES } from './main/styles';
import { PIRATE_CHARACTER_STYLES } from './pirate/styles';
import { SHARED_CHARACTER_STYLES } from './shared/styles';

/** All character CSS — concatenated from shared base + per-character modules. */
export const CHARACTER_STYLES = [
  SHARED_CHARACTER_STYLES,
  MAIN_CHARACTER_STYLES,
  COLORED_PROP_STYLES,
  MICROPHONE_STYLES,
  DJ_STYLES,
  NECKLACE_STYLES,
  VENDOR_CART_STYLES,
  LIGHTSABER_STYLES,
  PIRATE_CHARACTER_STYLES,
  LOADOUT_STYLES,
].join('\n');
