import { TopProp } from '../../props';
import type { ItemRenderer } from '../types';

export const RENDERERS: Record<string, ItemRenderer> = {
  'top-tee': ctx => <TopProp variant="tee" ctx={ctx} />,
  'top-tank': ctx => <TopProp variant="tank" ctx={ctx} />,
  'top-tie-dye': ctx => <TopProp variant="tie-dye" ctx={ctx} />,
};
