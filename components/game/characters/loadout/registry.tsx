import type { ReactNode } from 'react';
import { VENDOR_ITEM_PREVIEWS } from '@/lib/vendorShop';
import { BalloonAccessory } from '../main/accessory';
import { LOADOUT_CATALOG } from './catalog';
import type { ItemRenderer } from './registry/types';
import type { CharacterLoadout, LoadoutRenderCtx, LoadoutSlot } from './types';
import { LOADOUT_SLOTS, loadoutItemId } from './types';

const GLOWSTICK_IMAGE_SRCS = [
  '/images/props/festival_glowsticks.png',
  '/images/props/glow-sticks.png',
] as const;

const imagePreloads = new Map<string, Promise<void>>();
const imagesReady = new Set<string>();

/** Default balloon — kept in the main bundle for first paint. */
const CORE_RENDERERS: Record<string, ItemRenderer> = {
  'hand-balloon': ctx => (
    <BalloonAccessory color={ctx.props.color ?? ctx.balloonColor} />
  ),
};

const slotModules = new Map<LoadoutSlot, Record<string, ItemRenderer>>();
const slotLoads = new Map<LoadoutSlot, Promise<void>>();
let registryVersion = 0;
const listeners = new Set<() => void>();

const SLOT_IMPORTS: Record<
  LoadoutSlot,
  () => Promise<{ RENDERERS: Record<string, ItemRenderer> }>
> = {
  hand: () => import('./registry/slots/hand'),
  hat: () => import('./registry/slots/hat'),
  sunglasses: () => import('./registry/slots/sunglasses'),
  mask: () => import('./registry/slots/mask'),
  necklace: () => import('./registry/slots/necklace'),
  top: () => import('./registry/slots/top'),
  bottom: () => import('./registry/slots/bottom'),
};

function bumpRegistry() {
  registryVersion += 1;
  for (const notify of listeners) notify();
}

export function getLoadoutRegistryVersion(): number {
  return registryVersion;
}

export function subscribeLoadoutRegistry(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Load prop renderers for one slot (idempotent). */
export function preloadLoadoutSlot(slot: LoadoutSlot): Promise<void> {
  if (slotModules.has(slot)) return Promise.resolve();
  let pending = slotLoads.get(slot);
  if (!pending) {
    pending = SLOT_IMPORTS[slot]().then(mod => {
      slotModules.set(slot, mod.RENDERERS);
      bumpRegistry();
    });
    slotLoads.set(slot, pending);
  }
  return pending;
}

/** Load every slot chunk — use before opening Buz's shop. */
export function preloadAllLoadoutSlots(): Promise<void> {
  return Promise.all(LOADOUT_SLOTS.map(preloadLoadoutSlot)).then(() => {});
}

export function equippedLoadoutItemIds(loadout: CharacterLoadout): string[] {
  return LOADOUT_SLOTS
    .map(slot => loadoutItemId(loadout, slot))
    .filter((id): id is string => Boolean(id));
}

function preloadImage(url: string): Promise<void> {
  if (imagesReady.has(url)) return Promise.resolve();
  let pending = imagePreloads.get(url);
  if (!pending) {
    pending = new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        imagesReady.add(url);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
    imagePreloads.set(url, pending);
  }
  return pending;
}

/** Warm prop SVG/PNG assets used by equipped items. */
export function preloadLoadoutImages(itemIds: string[]): Promise<void> {
  const urls = new Set<string>();
  for (const id of itemIds) {
    const url = VENDOR_ITEM_PREVIEWS[id as keyof typeof VENDOR_ITEM_PREVIEWS];
    if (url) urls.add(url);
    if (id === 'party-glowsticks') {
      for (const src of GLOWSTICK_IMAGE_SRCS) urls.add(src);
    }
  }
  if (urls.size === 0) return Promise.resolve();
  return Promise.all([...urls].map(preloadImage)).then(() => {});
}

function rendererFor(itemId: string): ItemRenderer | undefined {
  if (CORE_RENDERERS[itemId]) return CORE_RENDERERS[itemId];
  const slot = LOADOUT_CATALOG[itemId]?.slot;
  if (!slot) return undefined;
  return slotModules.get(slot)?.[itemId];
}

/** True when slot chunks and prop images for these items are ready to paint. */
export function areLoadoutItemsReady(itemIds: string[]): boolean {
  for (const id of itemIds) {
    if (CORE_RENDERERS[id]) continue;
    const slot = LOADOUT_CATALOG[id]?.slot;
    if (!slot || !slotModules.has(slot) || !slotModules.get(slot)?.[id]) return false;
    const url = VENDOR_ITEM_PREVIEWS[id as keyof typeof VENDOR_ITEM_PREVIEWS];
    if (url && !imagesReady.has(url)) return false;
    if (id === 'party-glowsticks') {
      for (const src of GLOWSTICK_IMAGE_SRCS) {
        if (!imagesReady.has(src)) return false;
      }
    }
  }
  return true;
}

/** Load renderers for currently equipped items. */
export function preloadLoadoutItems(itemIds: string[]): Promise<void> {
  const slots = new Set<LoadoutSlot>();
  for (const id of itemIds) {
    const slot = LOADOUT_CATALOG[id]?.slot;
    if (slot) slots.add(slot);
  }
  return Promise.all([
    ...[...slots].map(preloadLoadoutSlot),
    preloadLoadoutImages(itemIds),
  ]).then(() => {});
}

/** Preload prop chunks for every equipped item across a crowd (player + NPCs). */
export function preloadCrowdLoadouts(
  loadouts: Array<CharacterLoadout | undefined>,
  extraItemIds: string[] = [],
): Promise<void> {
  const ids = new Set(extraItemIds);
  for (const loadout of loadouts) {
    if (!loadout) continue;
    for (const id of equippedLoadoutItemIds(loadout)) {
      ids.add(id);
    }
  }
  if (ids.size === 0) return Promise.resolve();
  return preloadLoadoutItems([...ids]);
}

export function renderLoadoutItem(itemId: string, ctx: LoadoutRenderCtx): ReactNode {
  const render = rendererFor(itemId);
  if (render) return render(ctx);

  const slot = LOADOUT_CATALOG[itemId]?.slot;
  if (slot && !slotModules.has(slot)) {
    void preloadLoadoutSlot(slot);
  }
  return null;
}

export function buildRenderCtx(
  itemId: string,
  balloonColor: string,
  propOverrides?: Record<string, string | undefined>,
): LoadoutRenderCtx {
  const def = LOADOUT_CATALOG[itemId];
  return {
    balloonColor,
    props: { ...def?.defaultProps, ...propOverrides },
  };
}

/** Which hand holds a mounted item (for dance animation). */
export function loadoutHoldSide(loadout: { hand?: string | null }): 'left' | 'right' {
  const id = loadout.hand;
  if (!id) return 'right';
  return LOADOUT_CATALOG[id]?.holdSide ?? 'right';
}

export function isLoadoutHandMounted(loadout: { hand?: string | null }): boolean {
  const id = loadout.hand;
  if (!id) return false;
  return LOADOUT_CATALOG[id]?.handMounted ?? false;
}

/** Render one equipped slot, or null when empty / unknown. */
export function renderLoadoutSlot(
  slot: LoadoutSlot,
  itemId: string | null | undefined,
  balloonColor: string,
): ReactNode {
  if (!itemId) return null;
  const def = LOADOUT_CATALOG[itemId];
  if (!def || def.slot !== slot) return null;
  return renderLoadoutItem(itemId, buildRenderCtx(itemId, balloonColor));
}
