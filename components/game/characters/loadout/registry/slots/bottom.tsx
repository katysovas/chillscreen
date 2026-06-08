import { BottomProp } from '../../props';
import type { ItemRenderer } from '../types';

export const RENDERERS: Record<string, ItemRenderer> = {
  'bottom-shorts': ctx => <BottomProp variant="shorts" ctx={ctx} />,
  'bottom-jeans': ctx => <BottomProp variant="jeans" ctx={ctx} />,
  'bottom-dress': ctx => <BottomProp variant="dress" ctx={ctx} />,
};
