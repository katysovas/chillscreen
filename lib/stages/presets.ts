import type { StagePresetDef, StagePresetId } from '@/lib/stages/types';

/** Whole-scene presets for creator stages — maps to existing venue bundles. */
export const STAGE_SCENE_PRESETS: StagePresetDef[] = [
  {
    id: 'thefarm',
    label: 'The Farm',
    tagline: 'Open fields & main stage vibes',
    venueRoute: 'tentaroo',
  },
  {
    id: 'forest',
    label: 'The Forest',
    tagline: 'Trees, lights & woodland energy',
    venueRoute: 'forest',
  },
  {
    id: 'thedesert',
    label: 'The Desert',
    tagline: 'Sun-baked main stage',
    venueRoute: 'coachella',
  },
  {
    id: 'silent-disco',
    label: 'Silent Disco',
    tagline: 'Neon headphones & dance floor',
    venueRoute: 'silent-disco',
  },
];

const PRESET_MAP = new Map<StagePresetId, StagePresetDef>(
  STAGE_SCENE_PRESETS.map(p => [p.id, p]),
);

export function stagePresetById(id: string): StagePresetDef | null {
  return PRESET_MAP.get(id as StagePresetId) ?? null;
}

export function venueRouteForStagePreset(id: StagePresetId): StagePresetDef['venueRoute'] {
  return PRESET_MAP.get(id)!.venueRoute;
}

export const STAGE_SKY_OPTIONS = [
  { id: 'day' as const, label: 'Day' },
  { id: 'morning' as const, label: 'Morning' },
  { id: 'evening' as const, label: 'Evening' },
  { id: 'night' as const, label: 'Night' },
];
