import type { CSSProperties } from 'react';

type HandPropVariant =
  | 'boombox' | 'balloons' | 'balloons2' | 'hotdog' | 'donut' | 'fries' | 'pizza'
  | 'tacos' | 'popcorn' | 'lollipop' | 'martini' | 'lemonade' | 'beer' | 'bottle'
  | 'water' | 'juice' | 'coffee' | 'glowsticks' | 'confetti' | 'fireworks'
  | 'sticker' | 'totem' | 'brush';

/** Hand prop rotation — inline so angle is correct before CSS recalc on load. */
const ROTATE: Record<HandPropVariant, { deg: number; origin: string; scale?: number }> = {
  boombox: { deg: 38, origin: '50% 92%' },
  balloons: { deg: 68, origin: '50% 92%' },
  'balloons2': { deg: 68, origin: '50% 92%' },
  totem: { deg: 50, origin: '50% 92%' },
  hotdog: { deg: 18, origin: '50% 88%' },
  donut: { deg: 18, origin: '50% 88%' },
  fries: { deg: 40, origin: '50% 88%' },
  pizza: { deg: 70, origin: '50% 88%' },
  tacos: { deg: 90, origin: '50% 88%' },
  popcorn: { deg: 70, origin: '50% 88%' },
  brush: { deg: 180, origin: '50% 88%' },
  lollipop: { deg: 110, origin: '50% 92%' },
  martini: { deg: 40, origin: '50% 88%' },
  lemonade: { deg: 40, origin: '50% 88%' },
  beer: { deg: 40, origin: '50% 88%' },
  bottle: { deg: 40, origin: '50% 88%' },
  water: { deg: 40, origin: '50% 88%' },
  juice: { deg: 40, origin: '50% 88%' },
  coffee: { deg: 40, origin: '50% 88%', scale: 0.82 },
  glowsticks: { deg: 339, origin: '50% 92%' },
  confetti: { deg: 50, origin: '50% 92%' },
  fireworks: { deg: 60, origin: '50% 92%' },
  sticker: { deg: 318, origin: '50% 92%' },
};

export function handPropRotateStyle(variant: HandPropVariant): CSSProperties {
  const r = ROTATE[variant];
  const transform = r.scale != null
    ? `rotate(${r.deg}deg) scale(${r.scale})`
    : `rotate(${r.deg}deg)`;
  return { transform, transformOrigin: r.origin };
}
