import type { LoadoutSlot } from '@/components/game/characters/loadout';

const HAT_ITEMS = [
  'hat-pirate-bandana',
  'hat-viking',
  'hat-lady',
  'hat-hunter',
  'hat-baseball',
  'hat-pamela',
  'hat-headphones',
] as const;

const GLASSES_ITEMS = [
  'shades-glasses',
  'shades-glasses-blue',
  'shades-glasses-green',
  'shades-glasses-circle',
  'shades-glasses-yellow',
  'shades-glasses-optic',
  'shades-glasses-skiing',
] as const;

const HAND_ITEMS = ['hand-sword', 'hand-lightsaber'] as const;

export type VendorShopItemId =
  | (typeof HAT_ITEMS)[number]
  | (typeof GLASSES_ITEMS)[number]
  | (typeof HAND_ITEMS)[number];

export type VendorShopCategory = {
  id: string;
  label: string;
  slot: LoadoutSlot;
  items: readonly VendorShopItemId[];
};

/** Store sections — add categories here as merch grows. */
export const VENDOR_SHOP_CATEGORIES: VendorShopCategory[] = [
  {
    id: 'hats',
    label: 'Hats',
    slot: 'hat',
    items: HAT_ITEMS,
  },
  {
    id: 'glasses',
    label: 'Glasses',
    slot: 'sunglasses',
    items: GLASSES_ITEMS,
  },
  {
    id: 'hands',
    label: 'Hands',
    slot: 'hand',
    items: HAND_ITEMS,
  },
];

export const DEFAULT_VENDOR_CATEGORY = VENDOR_SHOP_CATEGORIES[0]!.id;

/** Flat list — ids must exist in LOADOUT_CATALOG. */
export const VENDOR_SHOP_ITEMS: VendorShopItemId[] = [
  ...HAT_ITEMS,
  ...GLASSES_ITEMS,
  ...HAND_ITEMS,
];

export const BUZ_NPC_ID = 'buz';

/** Preview art for vendor cards — omit for inline CSS previews. */
export const VENDOR_ITEM_PREVIEWS: Partial<Record<VendorShopItemId, string>> = {
  'hat-pirate-bandana': '/images/props/pirate_hat.svg',
  'hat-viking': '/images/props/hat_viking.svg',
  'hat-lady': '/images/props/hat_lady.svg',
  'hat-hunter': '/images/props/hat_hunter.svg',
  'hat-baseball': '/images/props/hat_baseball.svg',
  'hat-pamela': '/images/props/hat_pamela.svg',
  'hat-headphones': '/images/props/headphones.svg',
  'shades-glasses': '/images/props/glasses.svg',
  'shades-glasses-blue': '/images/props/glasses_blue.svg',
  'shades-glasses-green': '/images/props/glasses_green.svg',
  'shades-glasses-circle': '/images/props/glasses_circle.svg',
  'shades-glasses-yellow': '/images/props/glasses_yellow.svg',
  'shades-glasses-optic': '/images/props/glasses_optic.svg',
  'shades-glasses-skiing': '/images/props/glasses_skiing.svg',
};

/** Thumbnail sizing tweaks per item in the shop panel. */
export const VENDOR_PREVIEW_SIZE: Partial<
  Record<VendorShopItemId, { width: number; height: number }>
> = {
  'hat-pirate-bandana': { width: 40, height: 22 },
  'hat-viking': { width: 30, height: 30 },
  'hat-lady': { width: 36, height: 26 },
  'hat-hunter': { width: 32, height: 32 },
  'hat-baseball': { width: 36, height: 24 },
  'hat-pamela': { width: 36, height: 26 },
  'hat-headphones': { width: 32, height: 28 },
  'shades-glasses': { width: 36, height: 16 },
  'shades-glasses-blue': { width: 36, height: 16 },
  'shades-glasses-green': { width: 36, height: 16 },
  'shades-glasses-circle': { width: 36, height: 16 },
  'shades-glasses-yellow': { width: 36, height: 16 },
  'shades-glasses-optic': { width: 36, height: 16 },
  'shades-glasses-skiing': { width: 36, height: 16 },
};
