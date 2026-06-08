import { NecklaceProp } from '../../props';
import type { ItemRenderer } from '../types';

export const RENDERERS: Record<string, ItemRenderer> = {
  'necklace-pendant': ctx => <NecklaceProp variant="pendant" ctx={ctx} />,
  'necklace-pearls': ctx => <NecklaceProp variant="pearls" ctx={ctx} />,
};
