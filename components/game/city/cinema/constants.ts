import { minStageScale } from '@/lib/stageViewport';

export const CREATOR_SCENE_HREF = '/images/cities/creator-cinema-scene.svg?v=1';

export const TENTAROO_GND = 660;

export const WHICH_STAGE_MID_X = 1620;

export const WHICH_STAGE_SCALE = minStageScale(1.95);

export const WHICH_STAGE_PUSH_Y = 88;

const WHICH_STAGE_W = 500;

export const WHICH_STAGE_HALF = Math.ceil((WHICH_STAGE_W * WHICH_STAGE_SCALE) / 2) + 28;

export const WHICH_STAGE_TOILET_HALF = Math.ceil((480 * WHICH_STAGE_SCALE) / 2) + 12;

export const WHICH_NEON = {
  green: '#38f5b0',
  cyan: '#2fe6ff',
  magenta: '#ff4fd8',
  amber: '#ffc14d',
  violet: '#9b6bff',
  edge: 'rgba(56,245,176,.55)',
} as const;
