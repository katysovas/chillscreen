import type { StageChannel } from '@/lib/stageVideos';

/** Easel paper — keyed out to transparent during quantize. */
export const EASEL_BG_HEX = '#fdfcf8';

export type StageDoodlePalette = {
  palette: string[];
  bgHex: string;
  /** Default grid edge length for this stage. */
  gridSize: number;
};

const BASE: StageDoodlePalette = {
  palette: ['#2b2622', '#6b5344', '#d99a4e', '#e8a9b5', '#4db5c4', '#7cb342', '#f1e2c4'],
  bgHex: EASEL_BG_HEX,
  gridSize: 24,
};

/** Per-channel stage palettes — fixed 6–8 entries for trivial validation. */
export const STAGE_DOODLE_PALETTE: Record<StageChannel, StageDoodlePalette> = {
  forest: {
    palette: ['#1a3324', '#2d5a3d', '#4a7c59', '#8fbc8f', '#c4a574', '#5c4033', '#f1e2c4'],
    bgHex: EASEL_BG_HEX,
    gridSize: 24,
  },
  'silent-disco': {
    palette: ['#1a0a2e', '#ff3df0', '#36e0c8', '#ffd700', '#6b2fa0', '#ffffff', '#2b2622'],
    bgHex: EASEL_BG_HEX,
    gridSize: 24,
  },
  coachella: {
    palette: ['#2b2622', '#e85074', '#f4a261', '#e9c46a', '#2a9d8f', '#f1e2c4', '#6b5344'],
    bgHex: EASEL_BG_HEX,
    gridSize: 24,
  },
  edc: {
    palette: ['#0d0221', '#ff2e9a', '#00f5ff', '#ffd700', '#7b2ff7', '#ffffff', '#2b2622'],
    bgHex: EASEL_BG_HEX,
    gridSize: 24,
  },
  bumbershoot: {
    palette: ['#1e3a5f', '#3d6b8a', '#87ceeb', '#f4d35e', '#ee6c4d', '#f1e2c4', '#2b2622'],
    bgHex: EASEL_BG_HEX,
    gridSize: 24,
  },
  'outside-lands': {
    palette: ['#c24f2c', '#f4a261', '#2a9d8f', '#264653', '#e9c46a', '#f1e2c4', '#2b2622'],
    bgHex: EASEL_BG_HEX,
    gridSize: 24,
  },
  cinema: { ...BASE },
  'deep-space': {
    palette: ['#090a0f', '#36e0c8', '#7b68ee', '#ffd700', '#ffffff', '#4a5568', '#1b2735'],
    bgHex: '#0a0c14',
    gridSize: 24,
  },
  'which-stage': { ...BASE },
  hula: {
    palette: ['#1a3324', '#ff6b35', '#f7c59f', '#2ec4b6', '#e71d36', '#f1e2c4', '#2b2622'],
    bgHex: EASEL_BG_HEX,
    gridSize: 24,
  },
  headliner: {
    palette: ['#014a7f', '#ffc662', '#f07c57', '#5a9c4e', '#ffe0bc', '#216182', '#f1e2c4'],
    bgHex: '#014a7f',
    gridSize: 24,
  },
};

export function paletteForStageChannel(channel: StageChannel): StageDoodlePalette {
  return STAGE_DOODLE_PALETTE[channel] ?? BASE;
}
