/** Per-connection chat spam limits — in-memory only, reset on disconnect. */

export const CHAT_SPAM_BURST = 5;
export const CHAT_SPAM_REFILL_MS = 2_000;
export const CHAT_SPAM_MAX_LEN = 280;
export const CHAT_SPAM_DUPLICATE_MS = 5_000;
export const CHAT_SPAM_TYPING_MIN_MS = 500; // ~2 Hz relay cap
export const CHAT_SPAM_ABUSE_DROPS = 20;
export const CHAT_SPAM_ABUSE_WINDOW_MS = 10_000;
export const CHAT_SPAM_MUTE_MS = 30_000;

export type ChatSpamState = {
  tokens: number;
  lastRefill: number;
  lastMsg: string;
  lastMsgAt: number;
  dropCount: number;
  dropWindowStart: number;
  mutedUntil: number;
  lastTypingRelayAt: number;
};

export function createChatSpamState(now = Date.now()): ChatSpamState {
  return {
    tokens: CHAT_SPAM_BURST,
    lastRefill: now,
    lastMsg: '',
    lastMsgAt: 0,
    dropCount: 0,
    dropWindowStart: 0,
    mutedUntil: 0,
    lastTypingRelayAt: 0,
  };
}

function refillTokens(state: ChatSpamState, now: number): void {
  if (now <= state.lastRefill) return;
  const added = Math.floor((now - state.lastRefill) / CHAT_SPAM_REFILL_MS);
  if (added <= 0) return;
  state.tokens = Math.min(CHAT_SPAM_BURST, state.tokens + added);
  state.lastRefill += added * CHAT_SPAM_REFILL_MS;
}

function recordDrop(state: ChatSpamState, now: number): void {
  if (
    state.dropWindowStart === 0
    || now - state.dropWindowStart > CHAT_SPAM_ABUSE_WINDOW_MS
  ) {
    state.dropWindowStart = now;
    state.dropCount = 1;
    return;
  }

  state.dropCount += 1;
  if (state.dropCount > CHAT_SPAM_ABUSE_DROPS) {
    state.mutedUntil = now + CHAT_SPAM_MUTE_MS;
    state.dropCount = 0;
    state.dropWindowStart = 0;
  }
}

function normalizeMessage(raw: string): string {
  const truncated = raw.length > CHAT_SPAM_MAX_LEN
    ? raw.slice(0, CHAT_SPAM_MAX_LEN)
    : raw;
  return truncated.trim().replace(/\s+/g, ' ');
}

export type ChatSpamCheckResult =
  | { ok: true; text: string }
  | { ok: false };

/** Rate + size + duplicate flood gate for player chat lines. Silent drop on reject. */
export function checkChatMessage(
  state: ChatSpamState,
  raw: string,
  now = Date.now(),
): ChatSpamCheckResult {
  if (now < state.mutedUntil) {
    recordDrop(state, now);
    return { ok: false };
  }

  const text = normalizeMessage(raw);
  if (!text) return { ok: false };

  if (
    text === state.lastMsg
    && state.lastMsgAt > 0
    && now - state.lastMsgAt < CHAT_SPAM_DUPLICATE_MS
  ) {
    recordDrop(state, now);
    return { ok: false };
  }

  refillTokens(state, now);
  if (state.tokens <= 0) {
    recordDrop(state, now);
    return { ok: false };
  }

  state.tokens -= 1;
  state.lastMsg = text;
  state.lastMsgAt = now;
  return { ok: true, text };
}

/** Relay cap for typing indicators — ~2 Hz per connection. */
export function checkTypingRelay(
  state: ChatSpamState,
  now = Date.now(),
): boolean {
  if (now - state.lastTypingRelayAt < CHAT_SPAM_TYPING_MIN_MS) return false;
  state.lastTypingRelayAt = now;
  return true;
}
