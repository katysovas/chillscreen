import type { FestieLlmProvider } from '@/lib/festie/llmProviders';
import type { PlayerLoadoutSync } from '@/lib/multiplayer/protocol';

export type FestieControlMode = 'human' | 'ai';

export function parseFestieControlMode(raw: unknown): FestieControlMode | null {
  if (raw === 'ai') return 'ai';
  if (raw === 'human') return 'human';
  return null;
}

export type FestiePreset = 'ember' | 'moss' | 'tide' | 'dusk';

export type FestieAttributes = {
  energy: number;
  friendliness: number;
  chattiness: number;
};

export type FestieRow = {
  id: string;
  user_id: string;
  name: string;
  preset: FestiePreset;
  attributes: FestieAttributes;
  topics: string[];
  personality_notes: string | null;
  stage_slug: string;
  llm_provider: FestieLlmProvider;
  last_seen_at: string;
  last_chat_at: string | null;
  owner_online: boolean;
  notify_email: string | null;
  email_opted_in: boolean;
  help_dismissed_at: string | null;
  control_mode: FestieControlMode;
  created_at: string;
};

export type FestiePublic = {
  id: string;
  name: string;
  preset: FestiePreset;
  attributes: FestieAttributes;
  topics: string[];
  personality_notes: string | null;
  stage_slug: string;
  llm_provider: FestieLlmProvider;
  last_seen_at: string;
  tier: 'live' | 'dim' | 'gone';
  /** True when the festie's human is signed in on this stage right now. */
  owner_on_stage?: boolean;
  /** Autopilot — festie wanders autonomously while owner is online. */
  control_mode?: FestieControlMode;
  /** Signed-in owner account — used to dedupe live remote avatars vs festie NPCs. */
  owner_user_id?: string;
  /** Owner's equipped vendor props (from users.loadout). */
  loadout?: PlayerLoadoutSync;
  /** Balloon color from owner loadout (falls back to preset). */
  balloon_color?: string;
};

/** Signed-in owner view — includes email recap prefs (never on stage sync). */
export type FestieOwner = FestiePublic & {
  notify_email: string | null;
  email_opted_in: boolean;
  help_dismissed_at: string | null;
  control_mode: FestieControlMode;
};

export type FestieCache = {
  id: string;
  name: string;
  preset: FestiePreset;
};
