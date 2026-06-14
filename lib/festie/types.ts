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
};

/** Signed-in owner view — includes email recap prefs (never on stage sync). */
export type FestieOwner = FestiePublic & {
  notify_email: string | null;
  email_opted_in: boolean;
};

export type FestieCache = {
  id: string;
  name: string;
  preset: FestiePreset;
};
