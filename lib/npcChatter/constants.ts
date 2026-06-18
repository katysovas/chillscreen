/** PartyKit NPC chatter scheduler — tuned for lower ambient frequency. */
export const ALARM_MIN_MS = 40_000;
export const ALARM_MAX_MS = 95_000;
export const CONVO_PROBABILITY = 0.18;
export const MAX_CONVOS_PER_ROOM_PER_HOUR = 9;
export const LINE_PACING_MIN_MS = 5_000;
export const LINE_PACING_MAX_MS = 9_500;
export const FIRST_CONVO_DELAY_MIN_MS = 18_000;
export const FIRST_CONVO_DELAY_MAX_MS = 35_000;
export const NPC_REPLY_DELAY_MIN_MS = 4_000;
export const NPC_REPLY_DELAY_MAX_MS = 9_000;
export const NPC_REPLY_COOLDOWN_MS = 28_000;
/** Solo NPC shouts / self-talk over room-chat — off; only pair convos run. */
export const SOLO_NPC_ROOM_REPLIES_ENABLED = false;
export const CHAT_BUFFER_SIZE = 20;
export const PROMPT_WINDOW_LINES = 15;

/** Stage chatter panel — NPCs react to the last few public lines. */
export const STAGE_CHATTER_PROMPT_LINES = 5;
export const STAGE_CHATTER_NPC_MIN = 1;
export const STAGE_CHATTER_NPC_MAX = 1;
export const STAGE_CHATTER_TRIGGER_PROBABILITY = 0.22;
export const STAGE_WAVE_DEBOUNCE_MIN_MS = 12_000;
export const STAGE_WAVE_DEBOUNCE_MAX_MS = 22_000;
export const STAGE_CHATTER_WAVE_DELAY_MIN_MS = 6_500;
export const STAGE_CHATTER_WAVE_DELAY_MAX_MS = 12_500;
export const STAGE_CHATTER_LINE_DELAY_MIN_MS = 5_500;
export const STAGE_CHATTER_LINE_DELAY_MAX_MS = 10_500;
export const STAGE_CHATTER_WAVE_COOLDOWN_MS = 90_000;
export const STAGE_CHATTER_NPC_COOLDOWN_MS = 55_000;
/** Stage panel lines — one short burst; a few words is ideal. */
export const STAGE_LINE_MAX_WORDS = 12;

export const STAGE_CHATTER_INTENTS = [
  'respond naturally to what was just said',
  'add a quick take or side comment',
  'ask a short follow-up question',
  'ask what someone meant or push for details',
  'push back or disagree',
  'drop a dry joke or one-liner',
] as const;

export type StageChatterIntent = (typeof STAGE_CHATTER_INTENTS)[number];

const STAGE_INTENT_POOL: StageChatterIntent[] = [
  ...STAGE_CHATTER_INTENTS,
  'ask a short follow-up question',
  'ask a short follow-up question',
  'ask what someone meant or push for details',
];

export function pickStageChatterIntent(): StageChatterIntent {
  return STAGE_INTENT_POOL[Math.floor(Math.random() * STAGE_INTENT_POOL.length)]!;
}

/** Per-line nudge — heavily biased toward micro-replies. */
const LINE_LENGTH_HINT_POOL: { hint: string; weight: number }[] = [
  { hint: 'length: tiny aside — 1–4 words only', weight: 5 },
  { hint: 'length: ultra short — 2–5 words only ("bet", "no way", "wait what")', weight: 5 },
  { hint: 'length: quick reaction — 3–6 words', weight: 4 },
  { hint: 'length: one sharp question ending with ? — under 8 words', weight: 3 },
  { hint: 'length: ask something — short question, end with ?', weight: 3 },
  { hint: 'length: short take — 7–10 words max, one thought only', weight: 2 },
];

export function pickLineLengthHint(): string {
  const total = LINE_LENGTH_HINT_POOL.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const { hint, weight } of LINE_LENGTH_HINT_POOL) {
    roll -= weight;
    if (roll <= 0) return hint;
  }
  return LINE_LENGTH_HINT_POOL[0]!.hint;
}

export function pickStageChatterNpcCount(): number {
  return STAGE_CHATTER_NPC_MIN
    + Math.floor(Math.random() * (STAGE_CHATTER_NPC_MAX - STAGE_CHATTER_NPC_MIN + 1));
}

export const SEED_STREAM_REACTIVE_PCT = 0.3;
export const SEED_GENERATED_PCT = 0.65;
export const SEED_AMBIENT_PCT = 0.05;

export const HOUSE_MODEL_DEFAULT = 'openai/gpt-4.1-nano';
/** Target max words per NPC chatter line (prompt guidance — complete lines are never chopped for display). */
export const NPC_LINE_MAX_WORDS = 12;
/** Room for a short complete line without the model getting cut off mid-thought. */
export const NPC_LINE_MAX_TOKENS = 36;
export const NPC_LINE_TIMEOUT_MS = 8_000;
/** OpenRouter sampling — keep ≥0.9; 0.7 reads flat/agreeable. */
export const NPC_LINE_TEMPERATURE = 0.95;

/** Weighted line budgets 3–7 for pair convos — bias shorter exchanges. */
export const LINE_BUDGET_WEIGHTS: { budget: number; weight: number }[] = [
  { budget: 3, weight: 7 },
  { budget: 4, weight: 6 },
  { budget: 5, weight: 2 },
  { budget: 6, weight: 1 },
  { budget: 7, weight: 0 },
];

export function jitterMs(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function pickLineBudget(): number {
  const total = LINE_BUDGET_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const { budget, weight } of LINE_BUDGET_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return budget;
  }
  return 5;
}

export function linePacingMs(text: string): number {
  const base = jitterMs(LINE_PACING_MIN_MS, LINE_PACING_MAX_MS);
  const extra = Math.min(2000, Math.floor(text.length / 8) * 200);
  return base + extra;
}
