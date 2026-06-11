import { HatProp } from '../../props';
import type { ItemRenderer } from '../types';

export const RENDERERS: Record<string, ItemRenderer> = {
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
  'hat-helmet': ctx => <HatProp variant="helmet-hat" ctx={ctx} />,
};
