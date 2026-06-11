/** PartyKit NPC chatter scheduler — spec v3 constants. */
export const ALARM_MIN_MS = 20_000;
export const ALARM_MAX_MS = 60_000;
export const CONVO_PROBABILITY = 0.4;
export const MAX_CONVOS_PER_ROOM_PER_HOUR = 20;
export const LINE_PACING_MIN_MS = 3_000;
export const LINE_PACING_MAX_MS = 6_000;
export const FIRST_CONVO_DELAY_MIN_MS = 5_000;
export const FIRST_CONVO_DELAY_MAX_MS = 10_000;
export const NPC_REPLY_DELAY_MIN_MS = 2_000;
export const NPC_REPLY_DELAY_MAX_MS = 5_000;
export const NPC_REPLY_COOLDOWN_MS = 15_000;
export const CHAT_BUFFER_SIZE = 20;
export const PROMPT_WINDOW_LINES = 15;

export const SEED_STREAM_REACTIVE_PCT = 0.3;
export const SEED_GENERATED_PCT = 0.65;
export const SEED_AMBIENT_PCT = 0.05;

export const HOUSE_MODEL_DEFAULT = 'openai/gpt-4.1-nano';
export const NPC_LINE_MAX_TOKENS = 30;
export const NPC_LINE_TIMEOUT_MS = 8_000;
/** OpenRouter sampling — keep ≥0.9; 0.7 reads flat/agreeable. */
export const NPC_LINE_TEMPERATURE = 0.95;
export const NPC_LINE_MIN_WORDS_HINT = 12;
/** Target max words per NPC chatter line (prompt + token cap). */
export const NPC_LINE_MAX_WORDS = 12;

/** Weighted line budgets 3–7 for pair convos. */
export const LINE_BUDGET_WEIGHTS: { budget: number; weight: number }[] = [
  { budget: 3, weight: 3 },
  { budget: 4, weight: 4 },
  { budget: 5, weight: 5 },
  { budget: 6, weight: 3 },
  { budget: 7, weight: 2 },
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
