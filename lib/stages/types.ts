import type { SkyPeriod } from '@/lib/skyTimeOfDay';
import type { VenueRoute } from '@/lib/venueSlugs';
import type { StageLifecycleTier } from '@/lib/stages/config';

export type StageStream = {
  url: string;
  videoId: string;
  title: string;
  /** YouTube channel / artist name — preferred for on-stage marquee. */
  channelTitle?: string;
  thumbnail: string;
  /** Seconds — required for PartyKit sync; null if unknown at paste time. */
  durationSec: number | null;
};

export type StagePresetId =
  | 'chill'
  | 'live'
  | 'cinema'
  | 'thefarm'
  | 'forest'
  | 'thedesert'
  | 'silent-disco';

export type UserStageRow = {
  slug: string;
  owner_id: string;
  festie_id: string;
  preset: StagePresetId;
  display_name: string;
  description: string | null;
  sky: SkyPeriod | null;
  streams: StageStream[];
  now_playing_index: number;
  shuffle_on_start: boolean;
  backdrop_url: string | null;
  featured: boolean;
  created_at: Date;
  last_active_at: Date;
  taken_down_at: Date | null;
};

export type UserStagePublic = {
  slug: string;
  displayName: string;
  /** Short blurb for homepage / stage picker. */
  description?: string | null;
  ownerId: string;
  festieId: string;
  preset: StagePresetId;
  sky?: SkyPeriod;
  streams: StageStream[];
  nowPlayingIndex: number;
  /** Pick a random lineup track when the first viewer opens an empty room. */
  shuffleOnStart: boolean;
  /** Custom City template skyline — public URL path. */
  backdropUrl?: string | null;
  createdAt: number;
  lastActiveAt: number;
  tier: StageLifecycleTier;
  takenDown: boolean;
  featured?: boolean;
};

/** Lightweight row for the Switch Stages picker. */
export type FeaturedStageSummary = {
  slug: string;
  displayName: string;
  preset: StagePresetId;
  description?: string | null;
  /** Custom City backdrop — used on landing / picker thumbnails when set. */
  backdropUrl?: string | null;
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
