import { SunglassesProp } from '../../props';
import type { ItemRenderer } from '../types';

export const RENDERERS: Record<string, ItemRenderer> = {
  'shades-round': ctx => <SunglassesProp variant="round" ctx={ctx} />,
  'shades-aviator': ctx => <SunglassesProp variant="aviator" ctx={ctx} />,
  'shades-glasses': ctx => <SunglassesProp variant="glasses" ctx={ctx} />,
  'shades-glasses-blue': ctx => <SunglassesProp variant="glasses-blue" ctx={ctx} />,
  'shades-glasses-green': ctx => <SunglassesProp variant="glasses-green" ctx={ctx} />,
  'shades-glasses-circle': ctx => <SunglassesProp variant="glasses-circle" ctx={ctx} />,
  'shades-glasses-yellow': ctx => <SunglassesProp variant="glasses-yellow" ctx={ctx} />,
  'shades-glasses-optic': ctx => <SunglassesProp variant="glasses-optic" ctx={ctx} />,
  'shades-glasses-skiing': ctx => <SunglassesProp variant="glasses-skiing" ctx={ctx} />,
};
