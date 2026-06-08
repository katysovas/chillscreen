import type { LoadoutSlot } from '@/components/game/characters/loadout/types';

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

const HAND_ITEMS = ['hand-sword', 'hand-lightsaber', 'hand-boombox', 'hand-balloons', 'hand-balloons-2'] as const;

const FOOD_ITEMS = ['food-hotdog', 'food-donut', 'food-fries', 'food-pizza', 'food-tacos', 'food-popcorn', 'food-lollipop'] as const;

const DRINK_ITEMS = ['drink-martini', 'drink-lemonade', 'drink-beer', 'drink-bottle', 'drink-water', 'drink-juice'] as const;

const PARTY_FAVOR_ITEMS = ['party-glowsticks', 'party-sticker'] as const;

export type VendorShopItemId =
  | (typeof HAT_ITEMS)[number]
  | (typeof GLASSES_ITEMS)[number]
  | (typeof HAND_ITEMS)[number]
  | (typeof FOOD_ITEMS)[number]
  | (typeof DRINK_ITEMS)[number]
  | (typeof PARTY_FAVOR_ITEMS)[number];

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
  {
    id: 'food',
    label: 'Food',
    slot: 'hand',
    items: FOOD_ITEMS,
  },
  {
    id: 'drinks',
    label: 'Drinks',
    slot: 'hand',
    items: DRINK_ITEMS,
  },
  {
    id: 'party-favors',
    label: 'Party Favors',
    slot: 'hand',
    items: PARTY_FAVOR_ITEMS,
  },
];

export const DEFAULT_VENDOR_CATEGORY = VENDOR_SHOP_CATEGORIES[0]!.id;

/** Flat list — ids must exist in LOADOUT_CATALOG. */
export const VENDOR_SHOP_ITEMS: VendorShopItemId[] = [
  ...HAT_ITEMS,
  ...GLASSES_ITEMS,
  ...HAND_ITEMS,
  ...FOOD_ITEMS,
  ...DRINK_ITEMS,
  ...PARTY_FAVOR_ITEMS,
];

/** Legacy id — prefer `isBuzNpc()`. */
export const BUZ_NPC_ID = 'buz';

export const BUZ_NPC_IDS = ['buz-concert', 'buz-coachella', 'buz-edc', 'buz-which-stage'] as const;

export function isBuzNpc(id: string): boolean {
  return id === BUZ_NPC_ID || id.startsWith('buz-');
}

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
  'hand-boombox': '/images/props/hands_boombox.svg',
  'hand-balloons': '/images/props/hands_balloons.svg',
  'hand-balloons-2': '/images/props/hands_balloons_2.svg',
  'food-hotdog': '/images/props/food_hotdog.svg',
  'food-donut': '/images/props/food_donut.svg',
  'food-fries': '/images/props/food_fries.svg',
  'food-pizza': '/images/props/food_pizza.svg',
  'food-tacos': '/images/props/food_tacos.svg',
  'food-popcorn': '/images/props/food_popcorn.svg',
  'food-lollipop': '/images/props/food_lollipop.svg',
  'drink-martini': '/images/props/drinks_martini.svg',
  'drink-lemonade': '/images/props/drinks_lemonade.svg',
  'drink-beer': '/images/props/drinks_beer.svg',
  'drink-bottle': '/images/props/drinks_bottle.svg',
  'drink-water': '/images/props/drinks_water.svg',
  'drink-juice': '/images/props/drinks_juice.svg',
  'party-glowsticks': '/images/props/festival_glowsticks.png',
  'party-sticker': '/images/props/sticker.svg',
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
  'hand-boombox': { width: 36, height: 28 },
  'hand-balloons': { width: 44, height: 44 },
  'hand-balloons-2': { width: 44, height: 44 },
  'food-hotdog': { width: 34, height: 22 },
  'food-donut': { width: 34, height: 22 },
  'food-fries': { width: 34, height: 22 },
  'food-pizza': { width: 34, height: 22 },
  'food-tacos': { width: 34, height: 22 },
  'food-popcorn': { width: 38, height: 26 },
  'food-lollipop': { width: 26, height: 38 },
  'drink-martini': { width: 28, height: 32 },
  'drink-lemonade': { width: 28, height: 32 },
  'drink-beer': { width: 28, height: 32 },
  'drink-bottle': { width: 28, height: 32 },
  'drink-water': { width: 28, height: 32 },
  'drink-juice': { width: 28, height: 32 },
  'party-glowsticks': { width: 32, height: 32 },
  'party-sticker': { width: 34, height: 34 },
};
