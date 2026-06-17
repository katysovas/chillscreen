import { WHICH_STAGE_MID_X } from '@/components/game/city/tentaroo/constants';
import { WORLD_TILE_CYCLE } from './worldTiles';
import { gndOriginForTile, midOriginForTile } from './worldTileGeometry';
import { MID_PARALLAX, VIEW_CENTER_X } from './venues';

/** Ground tile slot underfoot while the mid layer shows EDC (parallax desync). */
const EDC_CABANA_GROUND_SLOT = 6;
const EDC_CABANA_LOCAL_X = 1200;

/** Tentaroo tile — Which Stage home (mid layer). */
const TENTAROO_SLOT = 6;

/** On-screen x when a cabana sits beside its stage at scroll center (matches EDC preview). */
const CABANA_BESIDE_STAGE_SCREEN_X = 1222.8571428571413;

/** Sidewalk baseline — matches {@link GroundLayer} trees, dogs, hydrants. */
export const CABANA_GROUND_Y = 685;

/** Public asset — also used when rendering via `<image>` elsewhere. */
export const CABANA_ASSET = '/images/cabana.svg';
export const CABANA_REDDIT_LOGO = '/images/cabanas/reddit.svg';
export const CABANA_DISCORD_LOGO = '/images/cabanas/discord.svg';
/** @deprecated use CABANA_REDDIT_LOGO or per-placement logoAsset */
export const CABANA_LOGO_ASSET = CABANA_REDDIT_LOGO;

export const CABANA_VIEW_W = 620;
export const CABANA_VIEW_H = 560;
/** Cabana post bases inside the SVG viewBox. */
export const CABANA_SVG_GROUND_Y = 470;

/** Absolute ground x for the preview cabana on a given world-lap index. */
export function edcPreviewCabanaWorldX(cycleIndex: number): number {
  const tileIndex = cycleIndex * WORLD_TILE_CYCLE + EDC_CABANA_GROUND_SLOT;
  return gndOriginForTile(tileIndex) + EDC_CABANA_LOCAL_X;
}

/** Absolute ground x beside a mid-layer stage — same parallax offset as the EDC cabana. */
function cabanaBesideStageWorldX(
  cycleIndex: number,
  tileSlot: number,
  stageMidX: number,
): number {
  const tileIndex = cycleIndex * WORLD_TILE_CYCLE + tileSlot;
  const worldOff =
    (midOriginForTile(tileIndex) + stageMidX - VIEW_CENTER_X) / MID_PARALLAX;
  return CABANA_BESIDE_STAGE_SCREEN_X + worldOff;
}

/** Absolute ground x beside Which Stage. */
export function whichStageCabanaWorldX(cycleIndex: number): number {
  return cabanaBesideStageWorldX(cycleIndex, TENTAROO_SLOT, WHICH_STAGE_MID_X);
}

export type CabanaTheme = Partial<{
  canopy: string;
  canopyShade: string;
  canopyEdge: string;
  post: string;
  postShade: string;
  wall: string;
  curtain: string;
  curtainFold: string;
  carpet: string;
  carpetHi: string;
  carpetShade: string;
  accent: string;
  sign: string;
  signEdge: string;
  banner: string;
  bannerInk: string;
}>;

/** One placed VIP cabana — `x` is absolute ground scroll coordinate. */
export type CabanaPlacement = {
  id: string;
  /** Ground world x for `translate(x, …)` before scale. */
  x: number;
  scale?: number;
  /** Sidewalk ground y (default {@link CABANA_GROUND_Y}). */
  groundY?: number;
  bannerLine1?: string;
  bannerLine2?: string;
  logoAsset?: string;
  theme?: CabanaTheme;
};

const DEFAULT_THEME: Required<CabanaTheme> = {
  canopy: '#ffffff',
  canopyShade: '#e6e8f0',
  canopyEdge: '#d2d6e2',
  post: '#eef0f6',
  postShade: '#cdd2df',
  wall: '#dfe2ec',
  curtain: '#ffffff',
  curtainFold: '#dadeea',
  carpet: '#c0202e',
  carpetHi: '#d83948',
  carpetShade: '#9a141f',
  accent: '#d4af37',
  sign: '#ffffff',
  signEdge: '#d2d6e2',
  banner: '#ffffff',
  bannerInk: '#1c2030',
};

/** Preview cabana beside EDC — fixed ground world position (cycle 0). */
export const EDC_CABANA_WORLD_X = edcPreviewCabanaWorldX(0);

const EDC_PREVIEW_CABANA: CabanaPlacement = {
  id: 'edc-preview',
  x: EDC_CABANA_WORLD_X,
  scale: 0.44,
  groundY: CABANA_GROUND_Y,
  bannerLine1: 'VIP',
  bannerLine2: 'r/electricdaisycarnival',
};

const WHICH_STAGE_CABANA: CabanaPlacement = {
  id: 'which-stage-cabana',
  x: whichStageCabanaWorldX(0),
  scale: 0.44,
  groundY: CABANA_GROUND_Y,
  bannerLine1: 'VIP',
  bannerLine2: 'Festiverse',
  logoAsset: CABANA_DISCORD_LOGO,
};

const NO_WHICH_STAGE_CABANA_ROUTES = new Set([
  'creator-chill',
  'creator-cinema',
  'hula',
  'tentaroo',
  'forest',
  'silent-disco',
  'seattle-concerts',
]);

/** Static cabanas — always mounted; the scrolling viewBox handles visibility. */
export function staticCabanaPlacements(venueRoute?: string): CabanaPlacement[] {
  const all = [EDC_PREVIEW_CABANA, WHICH_STAGE_CABANA];
  if (venueRoute && NO_WHICH_STAGE_CABANA_ROUTES.has(venueRoute)) {
    return all.filter(c => c.id !== WHICH_STAGE_CABANA.id);
  }
  return all;
}

/** SVG transform — feet on `groundY` even when scaled (scale pivots at the base). */
export function cabanaTransform(placement: CabanaPlacement): string {
  const scale = placement.scale ?? 0.55;
  const groundY = placement.groundY ?? CABANA_GROUND_Y;
  return `translate(${placement.x},${groundY}) scale(${scale}) translate(0,${-CABANA_SVG_GROUND_Y})`;
}

export function cabanaThemeStyle(theme?: CabanaTheme): Record<string, string> {
  const t = { ...DEFAULT_THEME, ...theme };
  return {
    '--canopy': t.canopy,
    '--canopy-shade': t.canopyShade,
    '--canopy-edge': t.canopyEdge,
    '--post': t.post,
    '--post-shade': t.postShade,
    '--wall': t.wall,
    '--curtain': t.curtain,
    '--curtain-fold': t.curtainFold,
    '--carpet': t.carpet,
    '--carpet-hi': t.carpetHi,
    '--carpet-shade': t.carpetShade,
    '--accent': t.accent,
    '--sign': t.sign,
    '--sign-edge': t.signEdge,
    '--banner': t.banner,
    '--banner-ink': t.bannerInk,
  };
}
