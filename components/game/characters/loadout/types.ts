/** Wearable slots — one item per slot on a character. */
export type LoadoutSlot =
  | 'hat'
  | 'sunglasses'
  | 'mask'
  | 'necklace'
  | 'top'
  | 'bottom'
  | 'hand';

export const LOADOUT_SLOTS: LoadoutSlot[] = [
  'hat',
  'sunglasses',
  'mask',
  'necklace',
  'top',
  'bottom',
  'hand',
];

/** Equipped item ids per slot (`null` = empty). */
export type CharacterLoadout = {
  hat?: string | null;
  sunglasses?: string | null;
  mask?: string | null;
  necklace?: string | null;
  top?: string | null;
  bottom?: string | null;
  hand?: string | null;
  /** Tint for the default heart balloon and other colorized props. */
  balloonColor?: string;
  /** Vendor item ids purchased on this account (persists after unequip). */
  owned?: string[];
};

export type LoadoutItemProps = Record<string, string | undefined>;

/** Vendor-ready metadata — no React in this shape (safe for JSON / DB later). */
export type LoadoutItemDef = {
  id: string;
  slot: LoadoutSlot;
  name: string;
  description?: string;
  /** Future vendor price in credits. */
  vendorPrice?: number;
  /** Default colors / symbols passed to the prop component. */
  defaultProps?: LoadoutItemProps;
  /** Hand-held item occupies a hand (party dance anim). */
  handMounted?: boolean;
  holdSide?: 'left' | 'right';
};

export type LoadoutRenderCtx = {
  balloonColor: string;
  props: LoadoutItemProps;
};

export function loadoutItemId(
  loadout: CharacterLoadout | undefined,
  slot: LoadoutSlot,
): string | null {
  const id = loadout?.[slot];
  return id ?? null;
}
