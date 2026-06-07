import type { ReactNode } from 'react';
import { LOADOUT_CATALOG } from './catalog';
import {
  BottomProp,
  HandProp,
  HatProp,
  NecklaceProp,
  SunglassesProp,
  TopProp,
} from './props';
import type { LoadoutRenderCtx, LoadoutSlot } from './types';

type ItemRenderer = (ctx: LoadoutRenderCtx) => ReactNode;

/** Maps catalog ids → prop components. Add entries when authoring new vendor items. */
const RENDERERS: Record<string, ItemRenderer> = {
  'hand-balloon': ctx => <HandProp variant="balloon" ctx={ctx} />,
  'hand-microphone': ctx => <HandProp variant="microphone" ctx={ctx} />,
  'hand-lightsaber': ctx => <HandProp variant="lightsaber" ctx={ctx} />,
  'hand-sword': ctx => <HandProp variant="sword" ctx={ctx} />,

  'hat-beanie': ctx => <HatProp variant="beanie" ctx={ctx} />,
  'hat-cap': ctx => <HatProp variant="cap" ctx={ctx} />,
  'hat-chef': ctx => <HatProp variant="chef" ctx={ctx} />,
  'hat-pirate-bandana': ctx => <HatProp variant="pirate-hat" ctx={ctx} />,
  'hat-headphones': ctx => <HatProp variant="headphones" ctx={ctx} />,
  'hat-viking': ctx => <HatProp variant="viking-hat" ctx={ctx} />,
  'hat-lady': ctx => <HatProp variant="lady-hat" ctx={ctx} />,
  'hat-hunter': ctx => <HatProp variant="hunter-hat" ctx={ctx} />,
  'hat-baseball': ctx => <HatProp variant="baseball-hat" ctx={ctx} />,
  'hat-pamela': ctx => <HatProp variant="pamela-hat" ctx={ctx} />,
  'shades-round': ctx => <SunglassesProp variant="round" ctx={ctx} />,
  'shades-aviator': ctx => <SunglassesProp variant="aviator" ctx={ctx} />,
  'shades-glasses': ctx => <SunglassesProp variant="glasses" ctx={ctx} />,
  'shades-glasses-blue': ctx => <SunglassesProp variant="glasses-blue" ctx={ctx} />,
  'shades-glasses-green': ctx => <SunglassesProp variant="glasses-green" ctx={ctx} />,
  'shades-glasses-circle': ctx => <SunglassesProp variant="glasses-circle" ctx={ctx} />,
  'shades-glasses-yellow': ctx => <SunglassesProp variant="glasses-yellow" ctx={ctx} />,
  'shades-glasses-optic': ctx => <SunglassesProp variant="glasses-optic" ctx={ctx} />,
  'shades-glasses-skiing': ctx => <SunglassesProp variant="glasses-skiing" ctx={ctx} />,

  'necklace-pendant': ctx => <NecklaceProp variant="pendant" ctx={ctx} />,
  'necklace-pearls': ctx => <NecklaceProp variant="pearls" ctx={ctx} />,

  'top-tee': ctx => <TopProp variant="tee" ctx={ctx} />,
  'top-tank': ctx => <TopProp variant="tank" ctx={ctx} />,
  'top-tie-dye': ctx => <TopProp variant="tie-dye" ctx={ctx} />,

  'bottom-shorts': ctx => <BottomProp variant="shorts" ctx={ctx} />,
  'bottom-jeans': ctx => <BottomProp variant="jeans" ctx={ctx} />,
  'bottom-dress': ctx => <BottomProp variant="dress" ctx={ctx} />,
};

export function renderLoadoutItem(itemId: string, ctx: LoadoutRenderCtx): ReactNode {
  const render = RENDERERS[itemId];
  if (!render) return null;
  return render(ctx);
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
