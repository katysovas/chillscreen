/** PartyKit NPC chatter scheduler — tuned for lower ambient frequency. */
export const ALARM_MIN_MS = 28_000;
export const ALARM_MAX_MS = 72_000;
export const CONVO_PROBABILITY = 0.28;
export const MAX_CONVOS_PER_ROOM_PER_HOUR = 14;
export const LINE_PACING_MIN_MS = 4_500;
export const LINE_PACING_MAX_MS = 8_500;
export const FIRST_CONVO_DELAY_MIN_MS = 10_000;
export const FIRST_CONVO_DELAY_MAX_MS = 20_000;
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
export const STAGE_CHATTER_NPC_MAX = 2;
export const STAGE_CHATTER_TRIGGER_PROBABILITY = 0.35;
export const STAGE_WAVE_DEBOUNCE_MIN_MS = 9_000;
export const STAGE_WAVE_DEBOUNCE_MAX_MS = 16_000;
export const STAGE_CHATTER_WAVE_DELAY_MIN_MS = 5_500;
export const STAGE_CHATTER_WAVE_DELAY_MAX_MS = 11_000;
export const STAGE_CHATTER_LINE_DELAY_MIN_MS = 5_000;
export const STAGE_CHATTER_LINE_DELAY_MAX_MS = 9_500;
export const STAGE_CHATTER_WAVE_COOLDOWN_MS = 60_000;
export const STAGE_CHATTER_NPC_COOLDOWN_MS = 40_000;
/** Stage panel lines — 1–2 short sentences; can be just a few words. */
export const STAGE_LINE_MAX_WORDS = 18;

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

/** Per-line nudge so NPCs don't all sound the same length. */
export const LINE_LENGTH_HINTS = [
  'length: ultra short — 2–5 words only ("bet", "no way", "wait what")',
  'length: quick reaction — 3–6 words',
  'length: one sharp question ending with ?',
  'length: medium take — about 7–12 words',
  'length: longer rant — 13–18 words if the thought needs it',
  'length: tiny aside — 1–4 words is fine',
  'length: ask something — short question, end with ?',
] as const;

export function pickLineLengthHint(): string {
  return LINE_LENGTH_HINTS[Math.floor(Math.random() * LINE_LENGTH_HINTS.length)]!;
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
export const NPC_LINE_MAX_WORDS = 18;
/** Room for a short complete sentence without the model getting cut off mid-thought. */
export const NPC_LINE_MAX_TOKENS = 48;
export const NPC_LINE_TIMEOUT_MS = 8_000;
/** OpenRouter sampling — keep ≥0.9; 0.7 reads flat/agreeable. */
export const NPC_LINE_TEMPERATURE = 0.95;

/** Weighted line budgets 3–7 for pair convos — bias shorter exchanges. */
export const LINE_BUDGET_WEIGHTS: { budget: number; weight: number }[] = [
  { budget: 3, weight: 5 },
  { budget: 4, weight: 5 },
  { budget: 5, weight: 3 },
  { budget: 6, weight: 1 },
  { budget: 7, weight: 1 },
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
