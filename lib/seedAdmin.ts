/** Admin seed tooling — stage metadata, Reddit presets, LLM prompts. */

export type SeedStageMeta = {
  slug: string;
  label: string;
  /** Default subreddits for daily topic pulls. */
  subreddits: string[];
};

export const SEED_STAGE_META: SeedStageMeta[] = [
  { slug: 'thefarm', label: 'The Farm', subreddits: ['bonnaroo', 'festivals', 'Music'] },
  { slug: 'thedesert', label: 'The Desert', subreddits: ['Coachella', 'festivals', 'popculture'] },
  { slug: 'lasvegas', label: 'Las Vegas / EDC', subreddits: ['electricdaisycarnival', 'EDM', 'aves'] },
  { slug: 'forest', label: 'The Forest', subreddits: ['ElectricForest', 'festivals', 'aves'] },
  { slug: 'sanfrancisco', label: 'San Francisco', subreddits: ['sanfrancisco', 'bayarea', 'Music'] },
  { slug: 'seattle', label: 'Seattle', subreddits: ['seattle', 'Music', 'festivals'] },
  { slug: 'cinema', label: 'Chill Cinema', subreddits: ['movies', 'Letterboxd', 'netflix'] },
  { slug: 'space', label: 'Deep Space', subreddits: ['space', 'spaceporn', 'Astronomy'] },
  { slug: 'silent-disco', label: 'Silent Disco', subreddits: ['festivals', 'aves', 'EDM'] },
];

export const SEED_STAGE_SLUGS = SEED_STAGE_META.map(s => s.slug);

/** General culture / sports / festival chatter. */
export const GENERAL_SUBREDDITS = [
  'nba',
  'popculturechat',
  'Music',
  'festivals',
  'television',
  'entertainment',
  'movies',
];

export type SeedPoolTarget =
  | { scope: 'general'; kind: 'generated' | 'fallback' }
  | { scope: 'stage'; slug: string; kind: 'generated' | 'fallback' };

export type RedditTopicInput = {
  title: string;
  subreddit: string;
  score?: number;
};

export const SEED_GENERATOR_MODEL = 'gpt-4.1-mini';

const SEED_STYLE_EXAMPLES = [
  'knicks came back from 29 down and new york is gonna act like they invented basketball again',
  'coachella influencers in the pit filming vertical for people who werent invited — discuss',
  'edc at 3am when every stage sounds the same and youre too tired to pretend this drop changed your life',
];

export function buildSeedGeneratorPrompt(
  topics: RedditTopicInput[],
  target: SeedPoolTarget,
  stageLabel?: string,
): string {
  const context =
    target.scope === 'general'
      ? 'general festival / culture / sports room chat (all venues)'
      : `stage-specific seeds for "${stageLabel ?? target.slug}" — ${target.kind} pool`;

  const topicLines = topics
    .map(t => `- ${t.title} (r/${t.subreddit}${t.score != null ? `, ${t.score} pts` : ''})`)
    .join('\n');

  return `You write NPC conversation seed lines for WhichStage — a 2D festival walking game.

Task: turn these Reddit headlines into ${topics.length} seed line(s) for ${context}.

Rules for each seed:
- ONE sentence only, lowercase, casual group-chat voice
- spicy hot take or debate prompt — NPCs react secondhand, do not invent news details
- no profanity, slurs, or curse words
- no quotes, emoji, or name prefixes
- max ~25 words
- do not copy headlines verbatim — rephrase as a take people would argue about

Style examples:
${SEED_STYLE_EXAMPLES.map(s => `- ${s}`).join('\n')}

Reddit topics:
${topicLines}

Return JSON only: { "seeds": ["line one", "line two", ...] } — exactly ${topics.length} seed(s), one per topic.`;
}

export function parseGeneratedSeeds(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Response is not JSON');
    parsed = JSON.parse(match[0]);
  }
  const seeds = (parsed as { seeds?: unknown }).seeds;
  if (!Array.isArray(seeds)) throw new Error('Missing seeds array');
  const lines = seeds.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  if (lines.length === 0) throw new Error('No seeds in response');
  return lines;
}

export function dailySubredditsForTarget(target: SeedPoolTarget): string[] {
  if (target.scope === 'general') return GENERAL_SUBREDDITS;
  const meta = SEED_STAGE_META.find(s => s.slug === target.slug);
  return meta?.subreddits ?? GENERAL_SUBREDDITS;
}
