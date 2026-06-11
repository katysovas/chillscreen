import { MaskProp } from '../../props';
import type { ItemRenderer } from '../types';

export const RENDERERS: Record<string, ItemRenderer> = {
  'mask-1': ctx => <MaskProp variant="mask-1" ctx={ctx} />,
  'mask-2': ctx => <MaskProp variant="mask-2" ctx={ctx} />,
  'mask-3': ctx => <MaskProp variant="mask-3" ctx={ctx} />,
  'mask-6': ctx => <MaskProp variant="mask-6" ctx={ctx} />,
  'mask-mando': ctx => <MaskProp variant="mask-mando" ctx={ctx} />,
};
