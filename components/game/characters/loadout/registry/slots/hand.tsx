import { HandProp } from '../../props';
import type { ItemRenderer } from '../types';

/** Hand slot items — balloon stays in the core registry bundle. */
export const RENDERERS: Record<string, ItemRenderer> = {
  'hand-microphone': ctx => <HandProp variant="microphone" ctx={ctx} />,
  'hand-lightsaber': ctx => <HandProp variant="lightsaber" ctx={ctx} />,
  'hand-sword': ctx => <HandProp variant="sword" ctx={ctx} />,
  'hand-boombox': ctx => <HandProp variant="boombox" ctx={ctx} />,
  'hand-balloons': ctx => <HandProp variant="balloons" ctx={ctx} />,
  'hand-balloons-2': ctx => <HandProp variant="balloons2" ctx={ctx} />,
  'food-hotdog': ctx => <HandProp variant="hotdog" ctx={ctx} />,
  'food-donut': ctx => <HandProp variant="donut" ctx={ctx} />,
  'food-fries': ctx => <HandProp variant="fries" ctx={ctx} />,
  'food-pizza': ctx => <HandProp variant="pizza" ctx={ctx} />,
  'food-tacos': ctx => <HandProp variant="tacos" ctx={ctx} />,
  'food-popcorn': ctx => <HandProp variant="popcorn" ctx={ctx} />,
  'food-lollipop': ctx => <HandProp variant="lollipop" ctx={ctx} />,
  'drink-martini': ctx => <HandProp variant="martini" ctx={ctx} />,
  'drink-lemonade': ctx => <HandProp variant="lemonade" ctx={ctx} />,
  'drink-beer': ctx => <HandProp variant="beer" ctx={ctx} />,
  'drink-bottle': ctx => <HandProp variant="bottle" ctx={ctx} />,
  'drink-water': ctx => <HandProp variant="water" ctx={ctx} />,
  'drink-juice': ctx => <HandProp variant="juice" ctx={ctx} />,
  'party-glowsticks': ctx => <HandProp variant="glowsticks" ctx={ctx} />,
};
