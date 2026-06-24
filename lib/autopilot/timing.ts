export const AUTOPILOT_NPC_CHAT_WINDOW_MS = 6 * 60 * 1000;
export const AUTOPILOT_EASEL_WINDOW_MS = 12 * 60 * 1000;
export const AUTOPILOT_PARTY_PROP_WINDOW_MS = 5 * 60 * 1000;
export const AUTOPILOT_HUMAN_APPROACH_WINDOW_MS = 4 * 60 * 1000;
export const AUTOPILOT_RIVALRY_WINDOW_MS = 3 * 60 * 1000;
export const AUTOPILOT_LINEUP_VOTE_WINDOW_MS = 8 * 60 * 1000;
export const AUTOPILOT_DESCRIBE_SHOUTOUT_WINDOW_MS = 90 * 1000;
export const AUTOPILOT_JUMP_BURST_WINDOW_MS = 45 * 1000;
export const AUTOPILOT_FLEX_WINDOW_MS = 6 * 60 * 1000;
/** Rock-paper-scissors — frequent autopilot mini-game. */
export const AUTOPILOT_RPS_WINDOW_MS = 45 * 1000;

/** Autopilot nap after sustained runtime. */
export const AUTOPILOT_NAP_AFTER_MS = 18 * 60 * 1000;
export const AUTOPILOT_NAP_MIN_MS = 35 * 1000;
export const AUTOPILOT_NAP_MAX_MS = 75 * 1000;

export function nextAutopilotAtMs(windowMs: number, now = Date.now()): number {
  return now + Math.random() * windowMs;
}

export function nextAutopilotNapUntil(sessionStartedAt: number, now = Date.now()): number {
  const wake = AUTOPILOT_NAP_MIN_MS + Math.random() * (AUTOPILOT_NAP_MAX_MS - AUTOPILOT_NAP_MIN_MS);
  return now + wake;
}
