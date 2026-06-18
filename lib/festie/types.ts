import type { FestieLlmProvider } from '@/lib/festie/llmProviders';

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
};

/** Signed-in owner view — includes email recap prefs (never on stage sync). */
export type FestieOwner = FestiePublic & {
  notify_email: string | null;
  email_opted_in: boolean;
  help_dismissed_at: string | null;
};

export type FestieCache = {
  id: string;
  name: string;
  preset: FestiePreset;
};
