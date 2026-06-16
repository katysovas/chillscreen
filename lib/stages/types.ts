import type { SkyPeriod } from '@/lib/skyTimeOfDay';
import type { VenueRoute } from '@/lib/venueSlugs';
import type { StageLifecycleTier } from '@/lib/stages/config';

export type StageStream = {
  url: string;
  videoId: string;
  title: string;
  thumbnail: string;
  /** Seconds — required for PartyKit sync; null if unknown at paste time. */
  durationSec: number | null;
};

export type StagePresetId = 'thefarm' | 'forest' | 'thedesert' | 'silent-disco';

export type UserStageRow = {
  slug: string;
  owner_id: string;
  festie_id: string;
  preset: StagePresetId;
  sky: SkyPeriod | null;
  streams: StageStream[];
  now_playing_index: number;
  created_at: Date;
  last_active_at: Date;
  taken_down_at: Date | null;
};

export type UserStagePublic = {
  slug: string;
  ownerId: string;
  festieId: string;
  preset: StagePresetId;
  sky?: SkyPeriod;
  streams: StageStream[];
  nowPlayingIndex: number;
  createdAt: number;
  lastActiveAt: number;
  tier: StageLifecycleTier;
  takenDown: boolean;
};

export type StagePresetDef = {
  id: StagePresetId;
  label: string;
  tagline: string;
  venueRoute: VenueRoute;
};

export type CreateStageDraft = {
  slug: string;
  preset: StagePresetId;
  sky?: SkyPeriod;
  streams: StageStream[];
  festie: {
    name: string;
    password: string;
    preset: string;
    attributes?: { energy: number; friendliness: number; chattiness: number };
    topics?: string[];
    personality_notes?: string | null;
  };
};
