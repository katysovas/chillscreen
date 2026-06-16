import type { StagePresetDef, StagePresetId } from '@/lib/stages/types';
import type { VenueRoute } from '@/lib/venueSlugs';

/** Fallback when preset id is missing or unknown. */
export const DEFAULT_STAGE_PRESET: StagePresetId = 'chill';
const DEFAULT_VENUE_ROUTE: VenueRoute = 'creator-chill';

/** Plain lookup — safe during module init (no Map built from arrays). */
const PRESET_VENUE_ROUTES: Record<string, VenueRoute> = {
  chill: 'creator-chill',
  live: 'creator-chill',
  cinema: 'creator-cinema',
  'creator-chill': 'creator-chill',
  'creator-cinema': 'creator-cinema',
  thefarm: 'tentaroo',
  forest: 'forest',
  thedesert: 'coachella',
  'silent-disco': 'silent-disco',
};

/** Creator stage templates — each maps to its own visual bundle folder. */
export const CREATOR_STAGE_TEMPLATES: StagePresetDef[] = [
  {
    id: 'chill',
    label: 'Nature',
    tagline: 'Forest clearing under open sky',
    venueRoute: 'creator-chill',
  },
  {
    id: 'cinema',
    label: 'City',
    tagline: 'Urban skyline under shifting light',
    venueRoute: 'creator-cinema',
  },
];

/** Legacy presets for stages created before template picker. */
const LEGACY_STAGE_PRESETS: StagePresetDef[] = [
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

export const STAGE_SCENE_PRESETS: StagePresetDef[] = [
  ...CREATOR_STAGE_TEMPLATES,
  ...LEGACY_STAGE_PRESETS,
];

const PRESET_MAP = new Map<StagePresetId, StagePresetDef>(
  STAGE_SCENE_PRESETS.map(p => [p.id, p]),
);

/** Wrong IDs sometimes stored as venue routes instead of preset ids. */
const PRESET_ALIASES: Record<string, StagePresetId> = {
  'creator-chill': 'chill',
  'creator-live': 'chill',
  'creator-cinema': 'cinema',
  live: 'chill',
};

export function normalizeStagePresetId(id: string): StagePresetId | null {
  const key = id.trim().toLowerCase();
  const resolved = PRESET_ALIASES[key] ?? key;
  return PRESET_MAP.has(resolved as StagePresetId) ? (resolved as StagePresetId) : null;
}

export function stagePresetById(id: string): StagePresetDef | null {
  const normalized = normalizeStagePresetId(id);
  if (!normalized) return null;
  return PRESET_MAP.get(normalized) ?? null;
}

export function venueRouteForStagePreset(id: StagePresetId | string): VenueRoute {
  const key = String(id ?? '').trim().toLowerCase();
  return PRESET_VENUE_ROUTES[key] ?? DEFAULT_VENUE_ROUTE;
}

export const STAGE_SKY_OPTIONS = [
  { id: 'day' as const, label: 'Day' },
  { id: 'morning' as const, label: 'Morning' },
  { id: 'evening' as const, label: 'Evening' },
  { id: 'night' as const, label: 'Night' },
];
